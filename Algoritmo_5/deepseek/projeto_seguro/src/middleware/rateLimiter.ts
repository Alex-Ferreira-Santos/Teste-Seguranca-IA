import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// Rate limiter específico para registro
export const rateLimit = {
  registerLimiter: rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5'), // 5 tentativas
    message: { error: 'Muitas tentativas de cadastro. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return req.ip || req.socket.remoteAddress || 'unknown';
    },
    skip: (req: Request) => {
      // Permitir whitelist de IPs internos em desenvolvimento
      return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
    }
  }),
  
  loginLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 tentativas
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false
  })
};