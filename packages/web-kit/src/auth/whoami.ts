const knownRoleLabels = {
  admin: '管理员',
  trusted: '可信用户',
  member: '普通用户',
  restricted: '受限用户',
  banned: '已封禁',
} as const;

export type UserRole = keyof typeof knownRoleLabels;

export const roleLabels: Readonly<Record<UserRole, string>> &
  Readonly<Record<string, string>> = knownRoleLabels;

export const roles = Object.keys(knownRoleLabels);

export function isKnownRole(role: unknown): role is UserRole {
  return (
    typeof role === 'string' &&
    Object.prototype.hasOwnProperty.call(knownRoleLabels, role)
  );
}

/** 只读会话用户快照，createdAt 使用 Unix 毫秒。 */
export interface WhoamiUser {
  readonly id: number;
  readonly username: string;
  readonly role: UserRole;
  readonly createdAt: number;
  readonly adminMode: boolean;
}

/** 会话视图：登录状态、角色判定和派生展示字段的统一入口。 */
export interface Whoami {
  /** 会话用户快照；未登录为 `undefined`。 */
  readonly user: WhoamiUser | undefined;
  readonly isSignedIn: boolean;
  readonly isAdmin: boolean;
  readonly asAdmin: boolean;
  readonly roleLabel: string;
  hasRoleAtLeast(role: UserRole): boolean;
  isAtLeastDaysOld(days: number): boolean;
}
