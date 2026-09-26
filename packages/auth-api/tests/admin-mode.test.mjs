import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier === './role' &&
      context.parentURL?.endsWith('/src/session.ts')
    ) {
      return nextResolve('./role.ts', context);
    }
    return nextResolve(specifier, context);
  },
});

const { createAuthSession } = await import('../src/session.ts');

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

function makeStorage(initialToken, initialAdminMode) {
  const values = new Map([
    [
      'session',
      JSON.stringify({ token: initialToken, adminMode: initialAdminMode }),
    ],
  ]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test('admin mode persists only for the same administrator account', async () => {
  const storage = makeStorage(makeToken('member'), true);
  let nextToken = makeToken('admin');
  const session = createAuthSession({
    app: 'test',
    storage: { key: 'session', target: storage },
    requestLogout: async () => '',
    requestRefresh: async () => nextToken,
  });
  const observed = [];
  const unsubscribe = session.subscribeAdminMode((enabled) =>
    observed.push(enabled),
  );

  try {
    assert.deepEqual(observed, [false]);
    assert.equal(session.setAdminMode(true), false);
    assert.equal(session.toggleAdminMode(), false);

    await session.accessToken.refresh();
    assert.equal(session.setAdminMode(true), true);
    assert.equal(JSON.parse(storage.getItem('session')).adminMode, true);
    assert.deepEqual(observed, [false, true]);

    nextToken = makeToken('admin');
    await session.accessToken.refresh();
    assert.deepEqual(observed, [false, true]);

    const restored = createAuthSession({
      app: 'test',
      storage: { key: 'session', target: storage },
      requestLogout: async () => '',
      requestRefresh: async () => nextToken,
    });
    try {
      const restoredValues = [];
      restored.subscribeAdminMode((enabled) => restoredValues.push(enabled));
      assert.deepEqual(restoredValues, [true]);
    } finally {
      restored.dispose();
    }

    nextToken = makeToken('admin', 2);
    await session.accessToken.refresh();
    assert.deepEqual(observed, [false, true, false]);
    assert.equal(JSON.parse(storage.getItem('session')).adminMode, false);

    session.setAdminMode(true);
    nextToken = makeToken('member', 2);
    await session.accessToken.refresh();
    assert.deepEqual(observed, [false, true, false, true, false]);

    nextToken = makeToken('admin', 2);
    await session.accessToken.refresh();
    assert.equal(session.toggleAdminMode(), true);
    await session.logout();
    assert.deepEqual(observed.slice(-2), [true, false]);
    assert.equal(storage.getItem('session'), null);
  } finally {
    unsubscribe();
    session.dispose();
  }
});

test('admin mode follows storage changes from another tab', () => {
  const storage = makeStorage(makeToken('admin'), false);
  const windowEvents = new EventTarget();
  globalThis.window = windowEvents;
  const session = createAuthSession({
    app: 'test',
    storage: { key: 'session', target: storage },
    requestLogout: async () => '',
    requestRefresh: async () => makeToken('admin'),
  });
  const observed = [];
  session.subscribeAdminMode((enabled) => observed.push(enabled));

  function dispatchStorageChange() {
    const event = new Event('storage');
    Object.defineProperties(event, {
      storageArea: { value: storage },
      key: { value: 'session' },
    });
    windowEvents.dispatchEvent(event);
  }

  try {
    storage.setItem(
      'session',
      JSON.stringify({ token: makeToken('admin'), adminMode: true }),
    );
    dispatchStorageChange();
    assert.deepEqual(observed, [false, true]);

    storage.removeItem('session');
    dispatchStorageChange();
    assert.deepEqual(observed, [false, true, false]);
  } finally {
    session.dispose();
    delete globalThis.window;
  }
});
