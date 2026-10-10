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
