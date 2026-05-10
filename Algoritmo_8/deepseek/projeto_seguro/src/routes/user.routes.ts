import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { userSchemas } from '../schemas/validation.schemas';
import { Permissions } from '../config/permissions';
import { UserService } from '../services/user.service';

const router = Router();

// GET /api/users/:id - Get user by ID
router.get('/users/:id',
  AuthMiddleware.authenticate,
  validateRequest(userSchemas.userId, 'params'),
  AuthMiddleware.requireSameUserOrAdmin(),
  async (req, res) => {
    try {
      const user = await UserService.findById(req.params.id);
      res.json(user);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
);

// PUT /api/users/:id - Update user
router.put('/users/:id',
  AuthMiddleware.authenticate,
  validateRequest(userSchemas.userId, 'params'),
  validateRequest(userSchemas.updateUser),
  AuthMiddleware.requireSameUserOrAdmin(),
  async (req, res) => {
    try {
      const user = await UserService.update(req.params.id, req.body, req.user!.id);
      res.json({ message: 'User updated successfully', user });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// PUT /api/users/:id/roles - Update user roles (admin only)
router.put('/users/:id/roles',
  AuthMiddleware.authenticate,
  validateRequest(userSchemas.userId, 'params'),
  validateRequest(userSchemas.updateRoles),
  AuthMiddleware.requirePermissions([Permissions.ROLE.ASSIGN]),
  async (req, res) => {
    try {
      // Prevent self-privilege escalation
      if (req.params.id === req.user!.id) {
        return res.status(403).json({ error: 'Cannot modify your own roles' });
      }

      await UserService.updateRoles(req.params.id, req.body.roleIds, req.user!.id);
      res.json({ message: 'Roles updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// DELETE /api/users/:id - Soft delete user
router.delete('/users/:id',
  AuthMiddleware.authenticate,
  validateRequest(userSchemas.userId, 'params'),
  AuthMiddleware.requirePermissions([Permissions.USER.DELETE_ANY]),
  async (req, res) => {
    try {
      await UserService.softDelete(req.params.id, req.user!.id);
      res.json({ message: 'User deactivated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;