import assert from 'node:assert/strict';
import test from 'node:test';

import { isAccountAtLeastDaysOld } from '../src/account.ts';

const createdAt = 1_700_000_000;
const thirtyDaysLater = createdAt * 1000 + 30 * 24 * 60 * 60 * 1000;

test('account age reaches its threshold at the exact boundary', () => {
  assert.equal(
    isAccountAtLeastDaysOld({ createdAt }, 30, thirtyDaysLater - 1),
    false,
  );
  assert.equal(
    isAccountAtLeastDaysOld({ createdAt }, 30, thirtyDaysLater),
    true,
  );
  assert.equal(
    isAccountAtLeastDaysOld({ createdAt }, 30, thirtyDaysLater + 1),
    true,
  );
});

test('missing accounts and invalid timestamps do not pass age checks', () => {
  assert.equal(isAccountAtLeastDaysOld(undefined, 30, thirtyDaysLater), false);
  assert.equal(isAccountAtLeastDaysOld(null, 30, thirtyDaysLater), false);
  assert.equal(
    isAccountAtLeastDaysOld({ createdAt: Number.NaN }, 30, thirtyDaysLater),
    false,
  );
  assert.equal(
    isAccountAtLeastDaysOld({ createdAt }, -1, thirtyDaysLater),
    false,
  );
  assert.equal(isAccountAtLeastDaysOld({ createdAt }, 30, Number.NaN), false);
});
