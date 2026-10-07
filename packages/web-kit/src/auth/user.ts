import type { UserRole } from './role';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: number;
  username: string;
  role: UserRole;
  /** Unix 毫秒时间戳，与 Date 和 XTime 的数值输入一致。 */
  createdAt: number;
  adminMode: boolean;
}

type UserWithCreatedAt = Pick<SessionUser, 'createdAt'> | null | undefined;

/** Account creation time and now are expressed in Unix milliseconds. */
export function isAccountAtLeastDaysOld(
  user: UserWithCreatedAt,
  days: number,
  now = Date.now(),
): boolean {
  return (
    user != null &&
    Number.isFinite(user.createdAt) &&
    Number.isFinite(days) &&
    days >= 0 &&
    Number.isFinite(now) &&
    now - user.createdAt >= days * MILLISECONDS_PER_DAY
  );
}
