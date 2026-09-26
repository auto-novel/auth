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

test('account age reaches its threshold at the exact boundary', () => {
  assert.equal(
    AuthUser.isAtLeastDaysOld({ createdAt }, 30, thirtyDaysLater - 1),
    false,
  );
  assert.equal(
    AuthUser.isAtLeastDaysOld({ createdAt }, 30, thirtyDaysLater),
    true,
  );
  assert.equal(
    AuthUser.isAtLeastDaysOld({ createdAt }, 30, thirtyDaysLater + 1),
    true,
  );
});

test('missing accounts and invalid timestamps do not pass age checks', () => {
  assert.equal(
    AuthUser.isAtLeastDaysOld(undefined, 30, thirtyDaysLater),
    false,
  );
  assert.equal(AuthUser.isAtLeastDaysOld(null, 30, thirtyDaysLater), false);
  assert.equal(
    AuthUser.isAtLeastDaysOld({ createdAt: Number.NaN }, 30, thirtyDaysLater),
    false,
  );
  assert.equal(
    AuthUser.isAtLeastDaysOld({ createdAt }, -1, thirtyDaysLater),
    false,
  );
  assert.equal(AuthUser.isAtLeastDaysOld({ createdAt }, 30, Number.NaN), false);
});
