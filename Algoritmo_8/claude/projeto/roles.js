const ROLES = {
  admin: ['posts:read','posts:create','posts:edit','posts:delete','users:read','users:manage','reports:read'],
  editor: ['posts:read','posts:create','posts:edit','reports:read'],
  viewer: ['posts:read'],
};

function hasPermission(role, permission) {
  return ROLES[role]?.includes(permission) ?? false;
}

function getRolePermissions(role) {
  return ROLES[role] ?? [];
}

module.exports = { ROLES, hasPermission, getRolePermissions };
