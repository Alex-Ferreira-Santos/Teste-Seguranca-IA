import { Router } from 'express'

import { UsersController } from './users.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { requirePermissions } from '../../middleware/permission.middleware'

const router = Router()
const controller = new UsersController()

router.get(
  '/',
  authMiddleware,
  requirePermissions(['users.read']),
  controller.list
)

export default router