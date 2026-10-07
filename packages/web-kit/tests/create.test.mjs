import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

import { createApp, isReadonly } from 'vue';
import { notifications, Notify } from '../src/notifications/index.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier.startsWith('.') &&
      !/\.[a-z]+$/i.test(specifier) &&
      /\/packages\/web-kit\/src\//.test(context.parentURL ?? '')
    ) {
      return nextResolve(
        specifier === './notifications'
          ? './notifications/index.ts'
          : `${specifier}.ts`,
        context,
      );
    }
    return nextResolve(specifier, context);
  },
});

const { useWebKit } = await import('../src/context.ts');
const { useAccountActions, useMyStrikesLoader } =
  await import('../src/auth/context.ts');
let moduleId = 0;
async function freshFactory() {
  return (await import(`../src/create.ts?test=${++moduleId}`)).createWebKit;
}

const options = {
  auth: { app: 'test', url: '/auth/' },
  brand: 'Test',
};

function fakeBrowser(t) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    uid: 1,
    sub: 'member',
    role: 'member',
    crat: now,
    iat: now,
    exp: now + 3600,
  };
  const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
  const values = new Map([
    ['test-session', JSON.stringify({ token, adminMode: false })],
    ['test-web-theme', 'dark'],
  ]);
  const counts = {
    reads: 0,
    added: 0,
    removed: 0,
    timers: 0,
    cleared: 0,
    fetches: 0,
  };
  const timers = new Set();
  const storage = {
    getItem(key) {
      counts.reads++;
      return values.get(key) ?? null;
    },
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const events = new EventTarget();
  const browser = {
    location: { origin: 'https://web.example' },
    localStorage: storage,
    matchMedia: () => ({ matches: false }),
    addEventListener(...args) {
      counts.added++;
      events.addEventListener(...args);
    },
    removeEventListener(...args) {
      counts.removed++;
      events.removeEventListener(...args);
    },
  };
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: browser,
  });
  Notify.dismissAll();
  t.after(() => {
    Notify.dismissAll();
    if (previousWindow)
      Object.defineProperty(globalThis, 'window', previousWindow);
    else delete globalThis.window;
  });
  t.mock.method(globalThis, 'fetch', async () => {
    counts.fetches++;
    return Response.json({ strikes: { hasUnread: true } });
  });
  t.mock.method(globalThis, 'setInterval', () => {
    const timer = ++counts.timers;
    timers.add(timer);
    return timer;
  });
  t.mock.method(globalThis, 'clearInterval', (timer) => {
    counts.cleared++;
    timers.delete(timer);
  });
  return { counts, now, timers };
}

test('one successful create, no notification rebinding, and final idempotent disposal', async (t) => {
  const { counts, now, timers } = fakeBrowser(t);
  const createWebKit = await freshFactory();
  Notify.success('before creation');
  const beforeCreate = { ...counts };
  const kit = createWebKit(options);
  try {
    assert.deepEqual(counts, beforeCreate);
    assert.equal(kit.whoami.value.user, undefined);
    assert.equal(kit.whoami.value.isSignedIn, false);
    assert.equal(kit.theme.theme.value, 'light');
    kit.start();
    const afterStart = { ...counts };
    kit.start();
    assert.deepEqual(counts, afterStart);
    assert.equal(kit.theme.theme.value, 'dark');
    assert.equal(kit.options.auth.url, 'https://web.example/auth/');
    assert.equal(kit.whoami.value.user.username, 'member');
    // JWT `crat` 是 Unix 秒；whoami 已归一化为毫秒，供 XTime/Date 直接消费。
    assert.equal(kit.whoami.value.user.createdAt, now * 1000);
    // 归一化后的快照仍须保持深只读，不能被宿主改写。
    assert.equal(isReadonly(kit.whoami.value.user), true);
    const warnings = t.mock.method(console, 'warn', () => {});
    kit.whoami.value.user.username = 'tampered';
    assert.equal(kit.whoami.value.user.username, 'member');
    assert.ok(warnings.mock.callCount() > 0);
    assert.equal(kit.whoami.value.isSignedIn, true);
    assert.equal('notifications' in kit, false);
    assert.equal(counts.added, 1);
    assert.equal(counts.timers, 2); // auth refresh + attention polling
    assert.equal(counts.fetches, 0);
    assert.equal(notifications.items.value[0].message, 'before creation');

    const before = { ...counts };
    assert.throws(
      () =>
        createWebKit({
          get auth() {
            throw new Error('Must reject before reading options');
          },
        }),
      /only be called once/,
    );
    assert.throws(
      () => createWebKit({ ...options, brand: 'Different' }),
      /only be called once/,
    );
    assert.deepEqual(counts, before);
    Notify.error('after rejected creation');
    assert.deepEqual(
      notifications.items.value.map(({ message }) => message),
      ['after rejected creation', 'before creation'],
    );

    kit.dispose();
    assert.equal(counts.removed, 1);
    assert.equal(counts.cleared, 2);
    assert.equal(timers.size, 0);
    assert.deepEqual(notifications.items.value, []);
    const after = { ...counts };
    kit.dispose();
    assert.throws(() => createWebKit(options), /even after dispose/);
    assert.deepEqual(counts, after);
  } finally {
    kit.dispose();
  }
});

test('invalid initial URL does not consume the singleton or allocate resources', async (t) => {
  const { counts, timers } = fakeBrowser(t);
  const createWebKit = await freshFactory();
  const before = { ...counts };
  assert.throws(
    () =>
      createWebKit({ ...options, auth: { ...options.auth, url: 'http://[' } }),
    /cannot resolve auth.url/,
  );
  assert.deepEqual(counts, before);
  const kit = createWebKit(options);
  try {
    assert.deepEqual(counts, before);
    assert.equal(kit.whoami.value.isSignedIn, false);
    kit.start();
    assert.equal(kit.whoami.value.isSignedIn, true);
    assert.equal(counts.timers, 2); // auth refresh + attention polling
    assert.equal(counts.fetches, 0);
  } finally {
    kit.dispose();
  }
  assert.equal(timers.size, 0);
});

test('disposing before start preserves notifications and allocates no resources', async (t) => {
  const { counts, timers } = fakeBrowser(t);
  const createWebKit = await freshFactory();
  Notify.success('before creation');
  const before = { ...counts };
  const kit = createWebKit(options);
  kit.dispose();
  kit.dispose();
  assert.equal(kit.whoami.value.user, undefined);
  assert.equal(kit.whoami.value.isSignedIn, false);
  assert.equal(notifications.items.value[0].message, 'before creation');
  assert.throws(() => kit.start(), /disposed web kit/);
  assert.throws(() => kit.install(createApp({})), /disposed/);
  assert.throws(() => createWebKit(options), /even after dispose/);
  assert.deepEqual(counts, before);
  assert.equal(timers.size, 0);
});

test('single owner, context-only hooks, same-app idempotence, and unmount cleanup', async (t) => {
  const { counts, timers } = fakeBrowser(t);
  const createWebKit = await freshFactory();
  const kit = createWebKit(options);
  const app = createApp({});
  const otherApp = createApp({});
  const provide = t.mock.method(app, 'provide');
  const onUnmount = t.mock.method(app, 'onUnmount');
  const otherProvide = t.mock.method(otherApp, 'provide');
  try {
    kit.install(app);
    kit.install(app);
    assert.equal(provide.mock.callCount(), 3);
    assert.equal(onUnmount.mock.callCount(), 1);
    assert.equal(counts.timers, 2); // auth refresh + attention polling
    assert.equal(kit.theme.theme.value, 'dark');
    const context = app.runWithContext(useWebKit);
    assert.equal(context.api, kit.api);
    assert.equal(context.whoami, kit.whoami);
    assert.equal('install' in context, false);
    assert.equal('dispose' in context, false);
    assert.equal(context.attention, kit.attention);
    assert.equal(context.theme, kit.theme);
    assert.equal('start' in kit.theme, false);
    assert.equal('dispose' in kit.theme, false);
    assert.throws(() => kit.install(otherApp), /another app/);
    assert.equal(otherProvide.mock.callCount(), 0);
    await kit.attention.refresh();
    assert.equal(counts.fetches, 1);
    assert.equal(kit.attention.status.value.strikes.hasUnread, true);

    Notify.success('clear on unmount');
    const unmountCleanup = onUnmount.mock.calls[0].arguments[0];
    assert.equal(unmountCleanup, kit.dispose);
    unmountCleanup();
    unmountCleanup();
    kit.dispose();
    assert.equal(counts.removed, 1);
    assert.equal(counts.cleared, 2);
    assert.equal(timers.size, 0);
    assert.deepEqual(notifications.items.value, []);
    const themeAfterDispose = kit.theme.theme.value;
    kit.theme.toggleTheme();
    assert.equal(kit.theme.theme.value, themeAfterDispose);
    assert.throws(() => kit.install(app), /disposed/);
    assert.throws(() => kit.install(otherApp), /disposed/);
    assert.equal(provide.mock.callCount(), 3);
    assert.equal(onUnmount.mock.callCount(), 1);
  } finally {
    kit.dispose();
  }
});

test('public API hides session internals while sharing authentication with built-in features', async (t) => {
  fakeBrowser(t);
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (request) => {
    requests.push(request);
    const path = new URL(request.url).pathname;
    if (path.endsWith('/me/strikes')) {
      return Response.json({ total: 0, items: [], latestStrikeId: 0 });
    }
    if (path.endsWith('/admin/strikes')) return Response.json({ id: 42 });
    return Response.json({ strikes: { hasUnread: true } });
  });
  const createWebKit = await freshFactory();
  const kit = createWebKit(options);
  const client = kit.api.createClient('https://business.example/api/');
  const app = createApp({});
  try {
    kit.install(app);
    const context = app.runWithContext(useWebKit);
    const accountActions = app.runWithContext(useAccountActions);
    const loadMyStrikes = app.runWithContext(useMyStrikesLoader);
    assert.equal(context.api, kit.api);
    assert.deepEqual(Object.keys(accountActions).sort(), [
      'createLoginUrl',
      'handleLoginMessage',
      'toggleAdminMode',
    ]);
    assert.deepEqual(Object.keys(context.api).sort(), [
      'banUser',
      'checkSignedIn',
      'createClient',
      'createStrike',
      'logout',
    ]);
    assert.equal(Object.isFrozen(context.api), true);
    for (const name of [
      'start',
      'dispose',
      'watchUser',
      'createLoginUrl',
      'handleLoginMessage',
      'getAttentionStatus',
      'updateMyStrikeReadState',
      'getMyStrikes',
      'setAdminMode',
      'toggleAdminMode',
    ]) {
      assert.equal(name in context.api, false, name);
    }
    assert.throws(() => {
      context.api.logout = () => {};
    }, TypeError);
    assert.equal(await context.api.checkSignedIn(), true);
    await client.get('posts');
    await context.api.banUser({ username: 'other', reason: 'test' });
    assert.deepEqual(
      await context.api.createStrike({
        username: 'other',
        reason: 'test',
        evidence: 'test',
        point: 1,
      }),
      { id: 42 },
    );
    const businessRequest = requests.find(
      (request) => new URL(request.url).hostname === 'business.example',
    );
    const banRequest = requests.find((request) =>
      request.url.endsWith('/admin/user/ban'),
    );
    assert.match(businessRequest.headers.get('Authorization'), /^Bearer /);
    assert.equal(
      banRequest.headers.get('Authorization'),
      businessRequest.headers.get('Authorization'),
    );
    const loginUrl = new URL(accountActions.createLoginUrl('dark'));
    assert.equal(loginUrl.searchParams.get('app'), 'test');
    assert.equal(loginUrl.searchParams.get('theme'), 'dark');
    assert.deepEqual(await loadMyStrikes({ page: 1, pageSize: 20 }), {
      total: 0,
      items: [],
      latestStrikeId: 0,
    });
    await context.attention.refresh();
    assert.equal(context.attention.status.value.strikes.hasUnread, true);
    await context.api.logout();
    assert.equal(context.whoami.value.isSignedIn, false);
    assert.equal(context.attention.status.value, undefined);
    assert.equal(await context.api.checkSignedIn(), false);
  } finally {
    kit.dispose();
  }
});

test('login accepts only its iframe and refreshes the shared kit session', async (t) => {
  const { now } = fakeBrowser(t);
  const token = `header.${Buffer.from(
    JSON.stringify({
      uid: 2,
      sub: 'admin',
      role: 'admin',
      crat: now,
      iat: now,
      exp: now + 3600,
    }),
  ).toString('base64url')}.signature`;
  const refreshes = [];
  t.mock.method(globalThis, 'fetch', async (request) => {
    if (new URL(request.url).pathname.endsWith('/auth/refresh')) {
      refreshes.push(request);
      return new Response(token);
    }
    return Response.json({ strikes: { hasUnread: false } });
  });
  const createWebKit = await freshFactory();
  const kit = createWebKit(options);
  const app = createApp({});
  try {
    kit.install(app);
    const account = app.runWithContext(useAccountActions);
    const frame = {};
    const event = {
      origin: 'https://web.example',
      source: frame,
      data: { type: 'login_success' },
    };
    for (const invalid of [
      { ...event, origin: 'https://other.example' },
      { ...event, source: {} },
      { ...event, data: null },
      { ...event, data: 'login_success' },
      { ...event, data: { type: 'other' } },
    ]) {
      assert.equal(account.handleLoginMessage(invalid, frame), undefined);
    }
    assert.equal(account.handleLoginMessage(event, null), undefined);
    assert.equal(refreshes.length, 0);
    await account.handleLoginMessage(event, frame);
    assert.equal(refreshes.length, 1);
    assert.equal(new URL(refreshes[0].url).searchParams.get('app'), 'test');
    assert.equal(refreshes[0].credentials, 'include');
    assert.equal(kit.whoami.value.user.username, 'admin');
    assert.equal(kit.whoami.value.asAdmin, false);
    account.toggleAdminMode();
    assert.equal(kit.whoami.value.asAdmin, true);
    await kit.attention.refresh();
    kit.dispose();
    await assert.rejects(account.handleLoginMessage(event, frame), /disposed/);
    assert.equal(refreshes.length, 1);
  } finally {
    kit.dispose();
  }
});

test('the standalone auth package entry is unavailable', () => {
  assert.throws(() => import.meta.resolve('@novelia/web-kit/auth'), {
    code: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
  });
});
