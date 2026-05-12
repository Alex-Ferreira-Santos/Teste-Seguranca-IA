import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePermission, requireRole } from '../middleware/rbac.middleware';
import { Permission, Role, ROLE_PERMISSIONS, AuthRequest } from '../types/rbac.types';
import { auditLog } from '../utils/audit-log';
import { tokenBlacklist } from '../utils/token-blacklist';

const router = Router();

// Aplicar autenticação em todas as rotas deste router
router.use(authMiddleware);

// ─── Schema de validação (OWASP A03 - Injection) ───────────────────────────

const UpdateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(Role),
});

// ─── Rotas de usuários ──────────────────────────────────────────────────────

router.get(
  '/users',
  requirePermission(Permission.READ_USERS),
  async (req: AuthRequest, res: Response) => {
    // TODO: buscar usuários do banco
    // IMPORTANTE: nunca retornar hashes de senha, tokens, ou dados sensíveis
    res.json({ users: [] });
  }
);

router.delete(
  '/users/:id',
  requirePermission(Permission.DELETE_USERS),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Validar UUID para evitar injection
    if (!z.string().uuid().safeParse(id).success) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }

    // Impedir auto-exclusão (common mistake)
    if (id === req.user!.sub) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    // TODO: deletar usuário
    // Revogar todos os tokens ativos do usuário deletado
    await tokenBlacklist.revokeAllForUser(id);

    res.status(204).send();
  }
);

// ─── Gestão de roles (apenas admin) ────────────────────────────────────────

router.patch(
  '/users/:id/role',
  requireRole(Role.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const parsed = UpdateRoleSchema.safeParse({ userId: req.params.id, ...req.body });

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      return;
    }

    const { userId, role } = parsed.data;

    // Impedir escalada de privilégio via auto-promoção (OWASP A01)
    if (userId === req.user!.sub) {
      res.status(400).json({ error: 'Cannot change your own role' });
      return;
    }

    // TODO: buscar role atual do usuário no banco
    const currentRole = Role.USER; // placeholder

    // TODO: atualizar role no banco
    // Revogar tokens imediatamente para forçar re-login com novo role
    await tokenBlacklist.revokeAllForUser(userId);

    auditLog({
      event: 'role_changed',
      userId: req.user!.sub,
      role: req.user!.role,
      targetUserId: userId,
      oldRole: currentRole,
      newRole: role,
    });

    res.json({ message: 'Role updated. User must log in again.' });
  }
);

// ─── Endpoint para ver as próprias permissões ───────────────────────────────

router.get('/me/permissions', (req: AuthRequest, res: Response) => {
  const role = req.user!.role as Role;
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  // Retornar permissões sem expor detalhes internos
  res.json({ role, permissions });
});

export default router;
