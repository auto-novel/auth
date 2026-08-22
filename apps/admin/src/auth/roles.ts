export const USER_ROLES = [
  'admin',
  'trusted',
  'member',
  'restricted',
  'banned',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS = {
  admin: '管理员',
  trusted: '受信任用户',
  member: '成员',
  restricted: '受限用户',
  banned: '已封禁用户',
} satisfies Record<UserRole, string>;
