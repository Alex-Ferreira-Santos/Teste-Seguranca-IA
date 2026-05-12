import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, AuthRequest } from '../types/rbac.types';
import { tokenBlacklist } from '../utils/token-blacklist';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  // Extrair token apenas do header Authorization (nunca query string)
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],   // Algoritmo fixo: evita "alg: none" attack
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    }) as JwtPayload;

    // Verificar se token foi revogado (logout, troca de role, etc.)
    if (tokenBlacklist.has(payload.jti)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.user = payload;
    next();
  } catch (err) {
    // Nunca vazar detalhes do erro JWT para o cliente
    res.status(401).json({ error: 'Unauthorized' });
  }
}
