export const roleLabels: Readonly<Record<string, string>> = {
  admin: '管理员',
  trusted: '可信用户',
  member: '普通用户',
  restricted: '受限用户',
  banned: '已封禁',
};

export const roles = Object.keys(roleLabels);
