import assert from 'node:assert/strict';
import test from 'node:test';

import { AuthUser } from '../src/user.ts';

const createdAt = 1_700_000_000;
const thirtyDaysLater = createdAt * 1000 + 30 * 24 * 60 * 60 * 1000;

test('AuthUser groups optional-user predicates', () => {
  assert.equal(
    AuthUser.isAtLeastDaysOld({ createdAt }, 30, thirtyDaysLater),
    true,
  );
  assert.equal(
    AuthUser.isAtLeastDaysOld(undefined, 30, thirtyDaysLater),
    false,
  );
  assert.equal(AuthUser.hasRoleAtLeast({ role: 'trusted' }, 'member'), true);
  assert.equal(AuthUser.hasRoleAtLeast(undefined, 'member'), false);
  assert.equal(AuthUser.isAdmin({ role: 'admin' }), true);
  assert.equal(AuthUser.isAdmin({ role: 'trusted' }), false);
});
