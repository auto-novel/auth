import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

import { createApp } from 'vue';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier.startsWith('.') &&
      !/\.[a-z]+$/i.test(specifier) &&
      /\/packages\/(admin-kit|auth-api)\/src\//.test(context.parentURL ?? '')
    ) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const { useAdminKit } = await import('../src/context.ts');

let moduleId = 0;
async function freshFactory() {
  return (await import(`../src/create.ts?test=${++moduleId}`)).createAdminKit;
}

const options = {
  auth: { app: 'test', url: '/auth/' },
  brand: 'Test',
};

function fakeBrowser(t) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    uid: 1,
    sub: 'administrator',
    role: 'admin',
    crat: now,
    iat: now,
    exp: now + 3600,
  };
  const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
  const values = new Map([
    ['test-admin-session', JSON.stringify({ token, adminMode: false })],
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
    location: { origin: 'https://admin.example' },
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
  t.after(() => {
    if (previousWindow)
      Object.defineProperty(globalThis, 'window', previousWindow);
    else delete globalThis.window;
  });
  t.mock.method(globalThis, 'fetch', () => {
    counts.fetches++;
    throw new Error('Unexpected network request');
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

test('only one successful create, including after idempotent disposal', async (t) => {
  const { counts, timers } = fakeBrowser(t);
  const createAdminKit = await freshFactory();
  const beforeCreate = { ...counts };
  const kit = createAdminKit(options);
  try {
    assert.deepEqual(counts, beforeCreate);
    assert.equal(kit.profile.value, undefined);
    assert.equal(kit.isSignedIn.value, false);
    assert.equal(kit.isAuthorized.value, false);
    assert.equal(kit.theme.isDark.value, false);
    kit.start();
    const afterStart = { ...counts };
    kit.start();
    assert.deepEqual(counts, afterStart);
    assert.equal(kit.options.auth.url, 'https://admin.example/auth/');
    assert.equal(kit.profile.value.username, 'administrator');
    assert.equal(kit.isSignedIn.value, true);
    assert.equal(kit.isAuthorized.value, true);
    assert.equal(counts.added, 1);
    assert.equal(counts.timers, 1);
    assert.equal(counts.fetches, 0);

    const before = { ...counts };
    const unreadableOptions = {
      get auth() {
        throw new Error('Repeated create must reject before reading options');
      },
    };
    assert.throws(
      () => createAdminKit(unreadableOptions),
      /only be called once/,
    );
    assert.throws(
      () => createAdminKit({ ...options, brand: 'Different options' }),
      /only be called once/,
    );
    assert.deepEqual(counts, before);

    kit.dispose();
    assert.equal(counts.removed, 1);
    assert.equal(counts.cleared, 1);
    assert.equal(timers.size, 0);
    const after = { ...counts };
    kit.dispose();
    assert.throws(() => createAdminKit(options), /even after dispose/);
    assert.deepEqual(counts, after);
  } finally {
    kit.dispose();
  }
});

test('invalid initial URL does not consume the singleton or allocate resources', async (t) => {
  const { counts, timers } = fakeBrowser(t);
  const createAdminKit = await freshFactory();
  const before = { ...counts };
  assert.throws(
    () =>
      createAdminKit({
        ...options,
        auth: { ...options.auth, url: 'http://[' },
      }),
    TypeError,
  );
  assert.deepEqual(counts, before);
  const kit = createAdminKit(options);
  try {
    assert.deepEqual(counts, before);
    assert.equal(kit.isAuthorized.value, false);
    kit.start();
    assert.equal(kit.isAuthorized.value, true);
    assert.equal(counts.timers, 1);
    assert.equal(counts.added, 1);
    assert.equal(counts.fetches, 0);
  } finally {
    kit.dispose();
  }
  assert.equal(timers.size, 0);
});

test('disposing before start allocates no resources and is terminal', async (t) => {
  const { counts, timers } = fakeBrowser(t);
  const createAdminKit = await freshFactory();
  const before = { ...counts };
  const kit = createAdminKit(options);
  kit.dispose();
  kit.dispose();
  assert.equal(kit.profile.value, undefined);
  assert.equal(kit.isSignedIn.value, false);
  assert.equal(kit.isAuthorized.value, false);
  assert.throws(() => kit.start(), /disposed admin kit/);
  assert.throws(() => kit.install(createApp({})), /disposed admin kit/);
  assert.throws(() => createAdminKit(options), /even after dispose/);
  assert.deepEqual(counts, before);
  assert.equal(timers.size, 0);
});

test('one owner app, harmless same-app install, context only, and unmount disposal', async (t) => {
  const { counts, timers } = fakeBrowser(t);
  const createAdminKit = await freshFactory();
  const kit = createAdminKit(options);
  const app = createApp({});
  const otherApp = createApp({});
  const provide = t.mock.method(app, 'provide');
  const onUnmount = t.mock.method(app, 'onUnmount');
  const otherProvide = t.mock.method(otherApp, 'provide');
  try {
    assert.equal(kit.profile.value, undefined);
    assert.equal(counts.reads, 0);
    kit.install(app);
    assert.equal(kit.profile.value.username, 'administrator');
    assert.equal(kit.isSignedIn.value, true);
    assert.equal(kit.isAuthorized.value, true);
    assert.equal(counts.added, 1);
    assert.equal(counts.timers, 1);
    const afterInstall = { ...counts };
    kit.install(app);
    kit.start();
    assert.deepEqual(counts, afterInstall);
    assert.equal(provide.mock.callCount(), 1);
    assert.equal(onUnmount.mock.callCount(), 1);
    const context = app.runWithContext(useAdminKit);
    assert.equal(context.api, kit.api);
    assert.equal(context.profile, kit.profile);
    assert.equal('install' in context, false);
    assert.equal('dispose' in context, false);
    assert.throws(
      () => kit.install(otherApp),
      /only be installed on one Vue app/,
    );
    assert.equal(otherProvide.mock.callCount(), 0);

    const unmountCleanup = onUnmount.mock.calls[0].arguments[0];
    assert.equal(unmountCleanup, kit.dispose);
    unmountCleanup();
    unmountCleanup();
    kit.dispose();
    assert.equal(counts.removed, 1);
    assert.equal(counts.cleared, 1);
    assert.equal(timers.size, 0);
    assert.throws(() => kit.install(app), /disposed admin kit/);
    assert.throws(() => kit.install(otherApp), /disposed admin kit/);
    assert.equal(provide.mock.callCount(), 1);
    assert.equal(onUnmount.mock.callCount(), 1);
    assert.equal(counts.fetches, 0);
  } finally {
    kit.dispose();
  }
});
