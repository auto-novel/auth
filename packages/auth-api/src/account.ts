import type { AuthUser } from './session';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** Account creation time is expressed in Unix seconds. */
export function isAccountAtLeastDaysOld(
  user: Pick<AuthUser, 'createdAt'> | null | undefined,
  days: number,
  now = Date.now(),
): boolean {
  return (
    user != null &&
    Number.isFinite(user.createdAt) &&
    Number.isFinite(days) &&
    days >= 0 &&
    Number.isFinite(now) &&
    now - user.createdAt * 1000 >= days * MILLISECONDS_PER_DAY
  );
}
