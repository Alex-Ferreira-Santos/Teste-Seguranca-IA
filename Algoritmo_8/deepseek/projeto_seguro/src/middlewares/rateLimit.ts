import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { createClient } from 'redis';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Redis client
let redisClient: any = null;

try {
  redisClient = createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    enableReadyCheck: true,
  });
  redisClient.connect().catch(console.error);
} catch (error) {
  console.warn('Redis not available, using memory rate limiter');
}

// Rate limiters por tipo
const limiters = {
  // Limite padrão: 100 req/minuto
  default: redisClient 
    ? new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl_default',
        points: 100,
        duration: 60,
        blockDuration: 300,
      })
    : new RateLimiterMemory({
        points: 100,
        duration: 60,
        blockDuration: 300,
      }),

  // Limite estrito para auth: 5 req/15min
  auth: redisClient
    ? new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl_auth',
        points: 5,
        duration: 900,
        blockDuration: 1800,
      })
    : new RateLimiterMemory({
        points: 5,
        duration: 900,
        blockDuration: 1800,
      }),

  // Limite para APIs sensíveis: 50 req/min
  sensitive: redisClient
    ? new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl_sensitive',
        points: 50,
        duration: 60,
        blockDuration: 600,
      })
    : new RateLimiterMemory({
        points: 50,
        duration: 60,
        blockDuration: 600,
      }),

  // Limite para admins: 500 req/min
  admin: redisClient
    ? new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl_admin',
        points: 500,
        duration: 60,
        blockDuration: 60,
      })
    : new RateLimiterMemory({
        points: 500,
        duration: 60,
        blockDuration: 60,
      }),
};

// Middleware factory
export const rateLimitMiddleware = (type: keyof typeof limiters = 'default') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limiter = limiters[type];
      const key = `${req.ip}:${req.user?.id || 'anonymous'}`;
      
      await limiter.consume(key);
      
      // Adicionar headers de rate limit
      const rateLimitInfo = await limiter.get(key);
      if (rateLimitInfo) {
        res.setHeader('X-RateLimit-Limit', rateLimitInfo consumedPoints);
        res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remainingPoints);
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimitInfo.msBeforeNext));
      }
      
      next();
    } catch (error) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(error.msBeforeNext / 1000),
      });
    }
  };
};

// Rate limiter específico por endpoint
export const createEndpointLimiter = (config: {
  points: number;
  duration: number;
  blockDuration?: number;
}) => {
  const limiter = redisClient
    ? new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl_custom',
        ...config,
      })
    : new RateLimiterMemory(config);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `${req.method}:${req.path}:${req.ip}`;
      await limiter.consume(key);
      next();
    } catch (error) {
      res.status(429).json({
        error: 'Rate limit exceeded for this endpoint',
        retryAfter: Math.ceil(error.msBeforeNext / 1000),
      });
    }
  };
};

// Rate limiter baseado em role
export const roleBasedRateLimit = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.permissions?.includes('admin:roles:manage') 
      ? 'admin' 
      : req.user ? 'user' : 'anonymous';
    
    const limits = {
      admin: { points: 500, duration: 60 },
      user: { points: 100, duration: 60 },
      anonymous: { points: 20, duration: 60 },
    };
    
    const config = limits[role];
    const limiter = redisClient
      ? new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix: `rl_${role}`,
          ...config,
        })
      : new RateLimiterMemory(config);
    
    try {
      await limiter.consume(`${req.ip}:${req.user?.id || 'anon'}`);
      next();
    } catch (error) {
      res.status(429).json({ error: 'Rate limit exceeded for your role' });
    }
  };
};