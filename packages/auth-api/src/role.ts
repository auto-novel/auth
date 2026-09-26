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

const roleLevels: Readonly<Record<UserRole, number>> = {
  admin: 4,
  trusted: 3,
  member: 2,
  restricted: 1,
  banned: 0,
};

export function isKnownRole(role: unknown): role is UserRole {
  return (
    typeof role === 'string' &&
    Object.prototype.hasOwnProperty.call(roleLevels, role)
  );
}

export function isRoleAtLeast(role: unknown, requiredRole: unknown): boolean {
  return (
    isKnownRole(role) &&
    isKnownRole(requiredRole) &&
    roleLevels[role] >= roleLevels[requiredRole]
  );
}
