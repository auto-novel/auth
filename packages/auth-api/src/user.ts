import { isRoleAtLeast, type UserRole } from './role.ts';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
  createdAt: number;
}

type UserWithCreatedAt = Pick<AuthUser, 'createdAt'> | null | undefined;
type UserWithRole = Pick<AuthUser, 'role'> | null | undefined;

/** Account creation time is expressed in Unix seconds. */
function isAccountAtLeastDaysOld(
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
    now - user.createdAt * 1000 >= days * MILLISECONDS_PER_DAY
  );
}

/** User-focused predicates for session profiles and optional users. */
export const AuthUser = {
  isAtLeastDaysOld(user: UserWithCreatedAt, days: number, now?: number) {
    return isAccountAtLeastDaysOld(user, days, now);
  },
  hasRoleAtLeast(user: UserWithRole, requiredRole: unknown) {
    return isRoleAtLeast(user?.role, requiredRole);
  },
  isAdmin(user: UserWithRole) {
    return isRoleAtLeast(user?.role, 'admin');
  },
};
