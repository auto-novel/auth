import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

import { isKnownRole, roles } from '../src/auth/role.ts';

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

function makeToken(role) {
  const payload = {
    uid: 1,
    sub: 'user-1',
    role,
    crat: 1_700_000_000,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  return `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
}

function makeSession(t) {
  // 没有 window 时存储退回内存镜像，这两个用例不需要真实存储；只挡掉
  // 会话自带的续期定时器，否则它会拖住 Node 的事件循环。
  t.mock.method(globalThis, 'setInterval', () => 1);
  let token;
  return {
    session: createAuthSession({
      app: 'test',
      requestLogout: async () => '',
      requestRefresh: async () => token,
    }),
    setRole(role) {
      token = makeToken(role);
    },
  };
}

test('session role comparison follows the server role hierarchy', async (t) => {
  assert.deepEqual(roles, [
    'admin',
    'trusted',
    'member',
    'restricted',
    'banned',
  ]);
  const { session, setRole } = makeSession(t);
  await session.accessToken.ready();
  const { hasRoleAtLeast } = session.whoami.value;
  assert.equal(hasRoleAtLeast('banned'), false);

  for (const [index, role] of roles.entries()) {
    setRole(role);
    await session.accessToken.refresh();
    assert.equal(session.whoami.value.isAdmin, role === 'admin');
    for (const [requiredIndex, requiredRole] of roles.entries()) {
      assert.equal(hasRoleAtLeast(requiredRole), index <= requiredIndex);
    }
  }
  await session.logout();
  assert.equal(hasRoleAtLeast('banned'), false);
});

test('unknown roles never grant access', async (t) => {
  const { session, setRole } = makeSession(t);
  await session.accessToken.ready();
  setRole('admin');
  await session.accessToken.refresh();
  const { hasRoleAtLeast } = session.whoami.value;
  for (const unknown of [undefined, null, '', 'owner', '__proto__', 1]) {
    assert.equal(isKnownRole(unknown), false);
    assert.equal(hasRoleAtLeast(unknown), false);
    setRole(unknown);
    await assert.rejects(session.accessToken.refresh(), /访问令牌内容无效/);
    assert.equal(session.whoami.value.user.role, 'admin');
  }
});
