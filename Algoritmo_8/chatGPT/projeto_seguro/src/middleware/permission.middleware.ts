import { Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from './auth.middleware'

const prisma = new PrismaClient()

export function requirePermissions(permissions: string[]) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.user.sub

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const userPermissions = user.roles.flatMap((r) =>
      r.role.permissions.map((p) => p.permission.name)
    )

    const hasPermission = permissions.every((p) =>
      userPermissions.includes(p)
    )

    if (!hasPermission) {
      return res.status(403).json({
        message: 'Forbidden'
      })
    }

    next()
  }
}