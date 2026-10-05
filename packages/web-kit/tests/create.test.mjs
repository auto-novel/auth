import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

import { createApp } from 'vue';
import { notifications, Notify } from '../src/notifications/index.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier.startsWith('.') &&
      !/\.[a-z]+$/i.test(specifier) &&
      /\/packages\/(web-kit|auth-api)\/src\//.test(context.parentURL ?? '')
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

const { useAttention, useWebKit, useWebTheme } =
  await import('../src/context.ts');
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
  return { counts, timers };
}

test('one successful create, no notification rebinding, and final idempotent disposal', async (t) => {
  const { counts, timers } = fakeBrowser(t);
  const createWebKit = await freshFactory();
  Notify.success('before creation');
  const beforeCreate = { ...counts };
  const kit = createWebKit(options);
  try {
    assert.deepEqual(counts, beforeCreate);
    assert.equal(kit.profile.value, undefined);
    assert.equal(kit.isSignedIn.value, false);
    assert.equal(kit.theme.theme.value, 'light');
    kit.start();
    const afterStart = { ...counts };
    kit.start();
    assert.deepEqual(counts, afterStart);
    assert.equal(kit.theme.theme.value, 'dark');
    assert.equal(kit.options.auth.url, 'https://web.example/auth/');
    assert.equal(kit.profile.value.username, 'member');
    assert.equal(kit.isSignedIn.value, true);
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
    assert.equal(kit.isSignedIn.value, false);
    kit.start();
    assert.equal(kit.isSignedIn.value, true);
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
  assert.equal(kit.profile.value, undefined);
  assert.equal(kit.isSignedIn.value, false);
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
    assert.equal(provide.mock.callCount(), 1);
    assert.equal(onUnmount.mock.callCount(), 1);
    assert.equal(counts.timers, 2); // auth refresh + attention polling
    assert.equal(kit.theme.theme.value, 'dark');
    const context = app.runWithContext(useWebKit);
    assert.equal(context.api, kit.api);
    assert.equal(context.profile, kit.profile);
    assert.equal('install' in context, false);
    assert.equal('dispose' in context, false);
    assert.equal(app.runWithContext(useAttention), kit.attention);
    assert.equal(app.runWithContext(useWebTheme), kit.theme);
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
    assert.equal(provide.mock.callCount(), 1);
    assert.equal(onUnmount.mock.callCount(), 1);
  } finally {
    kit.dispose();
  }
});
