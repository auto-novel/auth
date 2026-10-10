import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

import { isReadonly, watch } from 'vue';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.endsWith('/src/auth/session.ts')) {
      if (specifier === './role') return nextResolve('./role.ts', context);
      if (specifier === '../storage')
        return nextResolve('../storage.ts', context);
    }
    return nextResolve(specifier, context);
  },
});

const { createAuthSession } = await import('../src/auth/session.ts');

function makeToken(role, id = 1) {
  const payload = {
    uid: id,
    sub: `user-${id}`,
    role,
    crat: 1_700_000_000,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  return `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
}

const SESSION_KEY = 'web-kit:session:v1';

function makeStorage(initialToken, initialAdminMode) {
  const values = new Map([
    [
      SESSION_KEY,
      JSON.stringify({ token: initialToken, adminMode: initialAdminMode }),
    ],
  ]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

/** 会话固定读写 window.localStorage，测试里换成替身。 */
function useStorage(t, storage, target = {}) {
  target.localStorage = storage;
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: target,
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else delete globalThis.window;
  });
}

test('admin mode persists only for the same administrator account', async (t) => {
  t.mock.method(globalThis, 'setInterval', () => 1);
  const storage = makeStorage(makeToken('member'), true);
  useStorage(t, storage);
  let nextToken = makeToken('admin');
  const session = createAuthSession({
    app: 'test',
    requestLogout: async () => '',
    requestRefresh: async () => nextToken,
  });
  const observed = [];
  const stop = watch(
    () => session.whoami.value.user,
    (user) => {
      observed.push(user?.adminMode);
    },
    { immediate: true, flush: 'sync' },
  );

  try {
    assert.deepEqual(observed, [false]);
    assert.equal(session.toggleAdminMode(), false);

    await session.accessToken.refresh();
    assert.equal(session.toggleAdminMode(), true);
    assert.equal(JSON.parse(storage.getItem(SESSION_KEY)).adminMode, true);
    assert.deepEqual(observed, [false, false, true]);

    nextToken = makeToken('admin');
    await session.accessToken.refresh();
    assert.deepEqual(observed, [false, false, true, true]);

    const restored = createAuthSession({
      app: 'test',
      requestLogout: async () => '',
      requestRefresh: async () => nextToken,
    });
    const restoredValues = [];
    watch(
      () => restored.whoami.value.user,
      (user) => restoredValues.push(user?.adminMode),
      {
        immediate: true,
        flush: 'sync',
      },
    );
    assert.deepEqual(restoredValues, [true]);

    nextToken = makeToken('admin', 2);
    await session.accessToken.refresh();
    assert.deepEqual(observed, [false, false, true, true, false]);
    assert.equal(JSON.parse(storage.getItem(SESSION_KEY)).adminMode, false);

    session.toggleAdminMode();
    nextToken = makeToken('member', 2);
    await session.accessToken.refresh();
    assert.deepEqual(observed, [false, false, true, true, false, true, false]);

    nextToken = makeToken('admin', 2);
    await session.accessToken.refresh();
    assert.equal(session.toggleAdminMode(), true);
    await session.logout();
    assert.deepEqual(observed.slice(-3), [false, true, undefined]);
    assert.equal(storage.getItem(SESSION_KEY), null);
  } finally {
    stop();
  }
});

test('admin mode follows storage changes from another tab', (t) => {
  t.mock.method(globalThis, 'setInterval', () => 1);
  const storage = makeStorage(makeToken('admin'), false);
  const windowEvents = new EventTarget();
  useStorage(t, storage, windowEvents);
  const session = createAuthSession({
    app: 'test',
    requestLogout: async () => '',
    requestRefresh: async () => makeToken('admin'),
  });
  const observed = [];
  const stop = watch(
    () => session.whoami.value.user,
    (user) => {
      observed.push(user?.adminMode);
    },
    { immediate: true, flush: 'sync' },
  );

  function dispatchStorageChange() {
    const event = new Event('storage');
    Object.defineProperties(event, {
      storageArea: { value: storage },
      key: { value: SESSION_KEY },
    });
    windowEvents.dispatchEvent(event);
  }

  try {
    storage.setItem(
      SESSION_KEY,
      JSON.stringify({ token: makeToken('admin'), adminMode: true }),
    );
    dispatchStorageChange();
    assert.deepEqual(observed, [false, true]);

    storage.removeItem(SESSION_KEY);
    dispatchStorageChange();
    assert.deepEqual(observed, [false, true, undefined]);
  } finally {
    stop();
  }
});

test('session users use milliseconds after restoring and refreshing a JWT', async (t) => {
  t.mock.method(globalThis, 'setInterval', () => 1);
  const token = makeToken('member');
  const storage = makeStorage(token, false);
  useStorage(t, storage);
  const session = createAuthSession({
    app: 'test',
    requestLogout: async () => '',
    requestRefresh: async () => makeToken('admin'),
  });
  let user;
  watch(
    () => session.whoami.value.user,
    (value) => {
      user = value;
    },
    { immediate: true, flush: 'sync' },
  );
  assert.equal(user.createdAt, 1_700_000_000_000);
  await session.accessToken.refresh();
  assert.equal(user.role, 'admin');
  assert.equal(user.createdAt, 1_700_000_000_000);
  const savedToken = JSON.parse(storage.getItem(SESSION_KEY)).token;
  const claims = JSON.parse(Buffer.from(savedToken.split('.')[1], 'base64url'));
  assert.equal(claims.crat, 1_700_000_000);
});

test('account age checks the exact boundary and follows the current session', async (t) => {
  t.mock.method(globalThis, 'setInterval', () => 1);
  const createdAt = 1_700_000_000_000;
  const threshold = createdAt + 30 * 24 * 60 * 60 * 1000;
  let now = threshold - 1;
  t.mock.method(Date, 'now', () => now);
  useStorage(t, makeStorage(makeToken('member'), false));
  const session = createAuthSession({
    app: 'test',
    requestLogout: async () => '',
    requestRefresh: async () => makeToken('member'),
  });
  const { isAtLeastDaysOld } = session.whoami.value;

  assert.equal(isAtLeastDaysOld(30), false);
  now = threshold;
  assert.equal(isAtLeastDaysOld(30), true);
  now = threshold + 1;
  assert.equal(isAtLeastDaysOld(30), true);
  for (const days of [-1, Number.NaN, Infinity]) {
    assert.equal(isAtLeastDaysOld(days), false);
  }
  now = Number.NaN;
  assert.equal(isAtLeastDaysOld(30), false);
  now = threshold;
  await session.logout();
  assert.equal(isAtLeastDaysOld(30), false);
  await session.accessToken.refresh();
  assert.equal(isAtLeastDaysOld(30), true);
});

test('a throwing observer cannot break token writes', async (t) => {
  t.mock.method(globalThis, 'setInterval', () => 1);
  t.mock.method(console, 'warn', () => {});
  const storage = makeStorage(makeToken('member'), false);
  useStorage(t, storage);
  const session = createAuthSession({
    app: 'test',
    requestLogout: async () => '',
    requestRefresh: async () => makeToken('admin'),
  });
  const boom = watch(
    () => session.whoami.value.user,
    () => {
      throw new Error('observer boom');
    },
    { flush: 'sync' },
  );

  try {
    // 开发模式下 Vue 会重抛 watcher 回调里的错误，会话必须自己挡住它。
    await session.accessToken.refresh();
    assert.equal(session.whoami.value.user.role, 'admin');
    await session.logout();
    assert.equal(session.whoami.value.user, undefined);
    assert.equal(storage.getItem(SESSION_KEY), null);
  } finally {
    boom();
  }
});
