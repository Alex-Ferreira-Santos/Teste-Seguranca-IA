import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { rateLimitMiddleware } from '../middlewares/rateLimit';
import { Permissions } from '../config/permissions';
import { roleSchemas, userSchemas } from '../schemas/validation.schemas';
import { AuditService } from '../services/audit.service';
import { UserService } from '../services/user.service';
import { Role } from '../entities/Role';

const router = Router();

// Todas as rotas admin requerem autenticação e permissões específicas
router.use(AuthMiddleware.authenticate);
router.use(rateLimitMiddleware('admin'));

// ==================== AUDIT LOGS ====================

// GET /api/admin/audit/logs - Visualizar logs de auditoria
router.get('/admin/audit/logs',
  AuthMiddleware.requirePermissions([Permissions.ADMIN.VIEW_AUDIT]),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const severity = req.query.severity as string;
      const userId = req.query.userId as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const logs = await AuditService.getAuditLogs({
        page,
        limit,
        severity,
        userId,
        startDate,
        endDate,
      });

      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
);

// GET /api/admin/audit/stats - Estatísticas de segurança
router.get('/admin/audit/stats',
  AuthMiddleware.requirePermissions([Permissions.ADMIN.VIEW_AUDIT]),
  async (req, res) => {
    try {
      const stats = await AuditService.getSecurityStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch security stats' });
    }
  }
);

// ==================== USER MANAGEMENT ====================

// GET /api/admin/users - Listar todos os usuários
router.get('/admin/users',
  AuthMiddleware.requirePermissions([Permissions.USER.READ_ANY]),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const search = req.query.search as string;
      const isActive = req.query.isActive === 'true' ? true : 
                      req.query.isActive === 'false' ? false : undefined;

      const users = await UserService.findAll({ page, limit, search, isActive });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

// GET /api/admin/users/:id - Detalhes completos do usuário
router.get('/admin/users/:id',
  AuthMiddleware.requirePermissions([Permissions.USER.READ_ANY]),
  validateRequest(userSchemas.userId, 'params'),
  async (req, res) => {
    try {
      const user = await UserService.findById(req.params.id, true); // true = incluir dados sensíveis
      res.json(user);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
);

// POST /api/admin/users/:id/disable - Desabilitar usuário
router.post('/admin/users/:id/disable',
  AuthMiddleware.requirePermissions([Permissions.USER.DELETE_ANY]),
  validateRequest(userSchemas.userId, 'params'),
  async (req, res) => {
    try {
      await UserService.softDelete(req.params.id, req.user!.id);
      
      await AuditService.log({
        userId: req.user!.id,
        action: 'USER_DISABLED_BY_ADMIN',
        resource: 'user',
        details: { targetUserId: req.params.id },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')!,
        success: true,
        severity: 'HIGH',
      });
      
      res.json({ message: 'User disabled successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// POST /api/admin/users/:id/enable - Reabilitar usuário
router.post('/admin/users/:id/enable',
  AuthMiddleware.requirePermissions([Permissions.USER.UPDATE_ANY]),
  validateRequest(userSchemas.userId, 'params'),
  async (req, res) => {
    try {
      await UserService.enableUser(req.params.id, req.user!.id);
      res.json({ message: 'User enabled successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ==================== ROLE MANAGEMENT ====================

// GET /api/admin/roles - Listar roles
router.get('/admin/roles',
  AuthMiddleware.requirePermissions([Permissions.ROLE.READ]),
  async (req, res) => {
    try {
      const roles = await Role.find({
        order: { level: 'DESC' },
      });
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  }
);

// POST /api/admin/roles - Criar nova role
router.post('/admin/roles',
  AuthMiddleware.requirePermissions([Permissions.ROLE.CREATE]),
  validateRequest(roleSchemas.createRole),
  async (req, res) => {
    try {
      const role = new Role();
      role.name = req.body.name;
      role.permissions = req.body.permissions;
      role.level = req.body.level;
      role.createdBy = req.user!.id;

      await role.save();

      await AuditService.log({
        userId: req.user!.id,
        action: 'ROLE_CREATED',
        resource: 'role',
        details: { roleName: role.name, permissions: role.permissions },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')!,
        success: true,
        severity: 'MEDIUM',
      });

      res.status(201).json(role);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// PUT /api/admin/roles/:id - Atualizar role
router.put('/admin/roles/:id',
  AuthMiddleware.requirePermissions([Permissions.ROLE.UPDATE]),
  validateRequest(roleSchemas.updateRole),
  async (req, res) => {
    try {
      const role = await Role.findOne({ where: { id: req.params.id } });
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      // Prevenir downgrade de super_admin
      if (role.name === 'super_admin' && req.user!.id !== 'system') {
        return res.status(403).json({ error: 'Cannot modify super_admin role' });
      }

      if (req.body.name) role.name = req.body.name;
      if (req.body.permissions) role.permissions = req.body.permissions;
      if (req.body.level !== undefined) role.level = req.body.level;

      await role.save();

      // Invalidar cache de permissões dos usuários com esta role
      await UserService.invalidateUserPermissionsByRole(role.id);

      await AuditService.log({
        userId: req.user!.id,
        action: 'ROLE_UPDATED',
        resource: 'role',
        details: { roleId: role.id, changes: req.body },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')!,
        success: true,
        severity: 'MEDIUM',
      });

      res.json(role);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// DELETE /api/admin/roles/:id - Deletar role
router.delete('/admin/roles/:id',
  AuthMiddleware.requirePermissions([Permissions.ROLE.DELETE]),
  async (req, res) => {
    try {
      const role = await Role.findOne({ where: { id: req.params.id } });
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      // Não permitir deletar roles padrão
      const defaultRoleNames = ['super_admin', 'admin', 'moderator', 'user', 'viewer'];
      if (defaultRoleNames.includes(role.name)) {
        return res.status(403).json({ error: 'Cannot delete default roles' });
      }

      await role.remove();

      await AuditService.log({
        userId: req.user!.id,
        action: 'ROLE_DELETED',
        resource: 'role',
        details: { roleName: role.name, roleId: role.id },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')!,
        success: true,
        severity: 'HIGH',
      });

      res.json({ message: 'Role deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ==================== SYSTEM METRICS ====================

// GET /api/admin/metrics - Métricas do sistema
router.get('/admin/metrics',
  AuthMiddleware.requirePermissions([Permissions.ADMIN.VIEW_METRICS]),
  async (req, res) => {
    try {
      const metrics = {
        users: {
          total: await UserService.countUsers(),
          active: await UserService.countActiveUsers(),
          newToday: await UserService.countNewUsersToday(),
        },
        security: {
          failedLoginsLastHour: await AuditService.countEvents('USER_LOGIN_FAILED', 3600),
          blockedIPs: await AuditService.countBlockedIPs(),
          criticalEventsLast24h: await AuditService.countCriticalEvents(86400),
        },
        system: {
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
      };
      
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  }
);

export default router;