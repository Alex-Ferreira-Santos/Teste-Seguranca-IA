import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { ApiResponse } from '../types';

// ─── JWT ───────────────────────────────────────────────────────────────────

interface JwtPayload {
  sub: string;       // userId
  sid: string;       // sessionId — para revogação
  iat: number;
  exp: number;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  // Aceita apenas Bearer token — sem fallback para query string (evita log exposure)
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Não autenticado' } satisfies ApiResponse);
    return;
  }

  const token = authHeader.slice(7);

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não configurado');

    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],     // whitelist de algoritmo — impede alg:none attack
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    }) as JwtPayload;

    // Injeta userId e sessionId no request de forma tipada
    (req as any).userId = payload.sub;
    (req as any).sessionId = payload.sid;

    next();
  } catch (err) {
    // Nunca expõe detalhes do erro JWT ao cliente (OWASP A07)
    res.status(401).json({ success: false, error: 'Token inválido ou expirado' } satisfies ApiResponse);
  }
}

// ─── Rate Limiting — OWASP A04 ────────────────────────────────────────────

export const progressRateLimiter = rateLimit({
  windowMs: 60 * 1000,      // janela de 1 minuto
  max: 30,                   // máx 30 requisições por IP por janela
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Muitas requisições. Tente novamente em breve.' } satisfies ApiResponse,
  keyGenerator: (req) => {
    // Usa userId autenticado se disponível, senão IP — evita bypass por rotação de IP
    return (req as any).userId ?? req.ip ?? 'unknown';
  },
});

// Rate limiter mais restrito para reads (anti-scraping)
export const readRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Muitas requisições.' } satisfies ApiResponse,
});