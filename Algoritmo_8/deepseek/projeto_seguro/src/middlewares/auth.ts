import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { createClient } from 'redis';
import { Permissions } from '../config/permissions';
import { SecurityAudit } from '../services/audit.service';

// Redis client para rate limiting
const redisClient = createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});
redisClient.connect().catch(console.error);

// Rate limiter por IP
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl',
  points: 100, // 100 requisições
  duration: 60, // por minuto
  blockDuration: 300, // bloqueia por 5 minutos
});

// Cache de permissões (Redis)
class PermissionCache {
  private static prefix = 'perm:';
  private static ttl = 300; // 5 minutos

  static async get(userId: string): Promise<string[]> {
    const key = `${this.prefix}${userId}`;
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);
    return null;
  }

  static async set(userId: string, permissions: string[]): Promise<void> {
    const key = `${this.prefix}${userId}`;
    await redisClient.setEx(key, this.ttl, JSON.stringify(permissions));
  }

  static async invalidate(userId: string): Promise<void> {
    await redisClient.del(`${this.prefix}${userId}`);
  }
}

// Extend Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        permissions: string[];
        mfaRequired: boolean;
      };
    }
  }
}

export class AuthMiddleware {
  static authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Rate limiting
      try {
        await rateLimiter.consume(req.ip);
      } catch {
        return res.status(429).json({ error: 'Too many requests' });
      }

      // Get token from cookie or header
      const token = req.cookies?.access_token || req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY!, {
        algorithms: ['RS256'],
      }) as any;

      // Check if token is revoked (logout)
      const isRevoked = await redisClient.get(`revoked:${token}`);
      if (isRevoked) {
        return res.status(401).json({ error: 'Session expired' });
      }

      // Get user permissions from cache or database
      let permissions = await PermissionCache.get(decoded.userId);
      
      if (!permissions) {
        const { User } = await import('../entities/User');
        const user = await User.findOne({
          where: { id: decoded.userId, isActive: true },
          relations: ['roles'],
        });
        
        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }
        
        permissions = [...new Set(user.roles.flatMap(r => r.permissions))];
        await PermissionCache.set(decoded.userId, permissions);
      }

      req.user = {
        id: decoded.userId,
        email: decoded.email,
        permissions,
        mfaRequired: decoded.mfaRequired,
      };

      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({ error: 'Invalid or expired session' });
    }
  };

  static requirePermissions = (requiredPermissions: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const hasAllPermissions = requiredPermissions.every(perm =>
          req.user?.permissions.includes(perm)
        );

        if (!hasAllPermissions) {
          // Log unauthorized attempt
          await SecurityAudit.log({
            userId: req.user?.id || 'anonymous',
            action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
            resource: req.path,
            details: { requiredPermissions, method: req.method },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            success: false,
            severity: 'HIGH',
          });

          return res.status(403).json({ 
            error: 'Insufficient permissions',
            required: requiredPermissions 
          });
        }

        next();
      } catch (error) {
        res.status(500).json({ error: 'Authorization error' });
      }
    };
  };

  static requireSameUserOrAdmin = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const targetUserId = req.params.id;
      const currentUserId = req.user?.id;
      const isAdmin = req.user?.permissions.includes(Permissions.USER.READ_ANY);

      if (targetUserId !== currentUserId && !isAdmin) {
        await SecurityAudit.log({
          userId: currentUserId!,
          action: 'IDOR_ATTEMPT',
          resource: req.path,
          details: { targetUserId },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          success: false,
          severity: 'HIGH',
        });
        
        return res.status(403).json({ error: 'Access denied' });
      }

      next();
    };
  };
}