import { isAccountAtLeastDaysOld } from './account.ts';
import { isRoleAtLeast } from './role.ts';
import type { AuthUser as AuthUserProfile } from './session';

export type AuthUser = AuthUserProfile;

type UserWithCreatedAt = Pick<AuthUserProfile, 'createdAt'> | null | undefined;
type UserWithRole = Pick<AuthUserProfile, 'role'> | null | undefined;

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
