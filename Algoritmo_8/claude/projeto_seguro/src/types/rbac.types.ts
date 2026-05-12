export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}

export enum Permission {
  // Users
  READ_USERS = 'read:users',
  CREATE_USERS = 'create:users',
  UPDATE_USERS = 'update:users',
  DELETE_USERS = 'delete:users',
  // Products
  READ_PRODUCTS = 'read:products',
  CREATE_PRODUCTS = 'create:products',
  UPDATE_PRODUCTS = 'update:products',
  DELETE_PRODUCTS = 'delete:products',
  // Reports
  READ_REPORTS = 'read:reports',
  EXPORT_REPORTS = 'export:reports',
}

// Mapeamento fixo: role -> permissions (evita IDOR via DB manipulation)
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),
  [Role.MANAGER]: [
    Permission.READ_USERS,
    Permission.READ_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.UPDATE_PRODUCTS,
    Permission.READ_REPORTS,
    Permission.EXPORT_REPORTS,
  ],
  [Role.USER]: [
    Permission.READ_PRODUCTS,
    Permission.READ_REPORTS,
  ],
};

export interface JwtPayload {
  sub: string;       // userId (UUID)
  role: Role;
  iat: number;
  exp: number;
  jti: string;       // JWT ID único (para revogação)
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
