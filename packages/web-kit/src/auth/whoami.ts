import type { UserRole } from './role';

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
