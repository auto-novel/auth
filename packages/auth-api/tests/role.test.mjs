import assert from 'node:assert/strict';
import test from 'node:test';

import { isKnownRole, isRoleAtLeast, roles } from '../src/role.ts';

test('role comparison follows the server role hierarchy', () => {
  assert.deepEqual(roles, [
    'admin',
    'trusted',
    'member',
    'restricted',
    'banned',
  ]);

  for (const [index, role] of roles.entries()) {
    assert.equal(isKnownRole(role), true);
    for (const [requiredIndex, requiredRole] of roles.entries()) {
      assert.equal(isRoleAtLeast(role, requiredRole), index <= requiredIndex);
    }
  }
});

test('unknown roles never grant access', () => {
  for (const unknown of [undefined, null, '', 'owner', '__proto__', 1]) {
    assert.equal(isKnownRole(unknown), false);
    assert.equal(isRoleAtLeast(unknown, 'member'), false);
    assert.equal(isRoleAtLeast('admin', unknown), false);
  }
});
