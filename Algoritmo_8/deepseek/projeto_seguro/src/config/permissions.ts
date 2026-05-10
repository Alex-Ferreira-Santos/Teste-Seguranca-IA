export const Permissions = {
  // User management
  USER: {
    CREATE: 'user:create',
    READ_SELF: 'user:read:self',
    READ_ANY: 'user:read:any',
    UPDATE_SELF: 'user:update:self',
    UPDATE_ANY: 'user:update:any',
    DELETE_SELF: 'user:delete:self',
    DELETE_ANY: 'user:delete:any',
  },
  
  // Role management
  ROLE: {
    CREATE: 'role:create',
    READ: 'role:read',
    UPDATE: 'role:update',
    DELETE: 'role:delete',
    ASSIGN: 'role:assign',
  },
  
  // Content
  CONTENT: {
    CREATE: 'content:create',
    READ: 'content:read',
    UPDATE_OWN: 'content:update:own',
    UPDATE_ANY: 'content:update:any',
    DELETE_OWN: 'content:delete:own',
    DELETE_ANY: 'content:delete:any',
    PUBLISH: 'content:publish',
  },
  
  // Admin
  ADMIN: {
    VIEW_AUDIT: 'admin:audit:view',
    SYSTEM_CONFIG: 'admin:system:config',
    VIEW_METRICS: 'admin:metrics:view',
  },
};

export const DefaultRoles = {
  SUPER_ADMIN: {
    name: 'super_admin',
    level: 100,
    permissions: Object.values(Permissions).flatMap(p => Object.values(p)),
  },
  ADMIN: {
    name: 'admin',
    level: 80,
    permissions: [
      Permissions.USER.READ_ANY,
      Permissions.USER.UPDATE_ANY,
      Permissions.ROLE.READ,
      Permissions.ROLE.ASSIGN,
      Permissions.CONTENT.UPDATE_ANY,
      Permissions.CONTENT.DELETE_ANY,
      Permissions.ADMIN.VIEW_AUDIT,
    ],
  },
  MODERATOR: {
    name: 'moderator',
    level: 60,
    permissions: [
      Permissions.USER.READ_ANY,
      Permissions.CONTENT.UPDATE_ANY,
      Permissions.CONTENT.DELETE_ANY,
      Permissions.CONTENT.PUBLISH,
    ],
  },
  USER: {
    name: 'user',
    level: 20,
    permissions: [
      Permissions.USER.READ_SELF,
      Permissions.USER.UPDATE_SELF,
      Permissions.CONTENT.CREATE,
      Permissions.CONTENT.UPDATE_OWN,
      Permissions.CONTENT.DELETE_OWN,
      Permissions.CONTENT.READ,
    ],
  },
  VIEWER: {
    name: 'viewer',
    level: 10,
    permissions: [Permissions.CONTENT.READ],
  },
};