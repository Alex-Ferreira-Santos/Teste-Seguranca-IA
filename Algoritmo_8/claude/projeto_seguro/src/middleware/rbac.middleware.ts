import { Response, NextFunction } from 'express';
import { Permission, Role, ROLE_PERMISSIONS, AuthRequest } from '../types/rbac.types';
import { auditLog } from '../utils/audit-log';

/**
 * Middleware de autorização RBAC.
 * Princípio do Least Privilege: requer permissões explícitas, não roles.
 * Isso permite que roles sejam ampliadas sem alterar o código das rotas.
 *
 * @example
 *   router.get('/users', authMiddleware, requirePermission(Permission.READ_USERS), handler)
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userPermissions = ROLE_PERMISSIONS[user.role as Role] ?? [];
    const hasAll = permissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      // Audit log: tentativas de acesso negado (OWASP A09 - Security Logging)
      auditLog({
        event: 'access_denied',
        userId: user.sub,
        role: user.role,
        requiredPermissions: permissions,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      // 403 genérico: não revelar quais permissões são necessárias
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Log de acesso bem-sucedido para auditoria
    auditLog({
      event: 'access_granted',
      userId: user.sub,
      role: user.role,
      requiredPermissions: permissions,
      path: req.path,
      method: req.method,
    });

    next();
  };
}

/**
 * Alias para verificar role diretamente quando necessário.
 * Prefira requirePermission() quando possível.
 */
export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user || !roles.includes(user.role as Role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
}
