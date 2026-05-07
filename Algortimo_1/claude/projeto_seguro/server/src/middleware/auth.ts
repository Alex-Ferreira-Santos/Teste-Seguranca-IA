import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

// Extende o tipo Request do Express para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string };
    }
  }
}

// ─── MIDDLEWARE DE AUTENTICAÇÃO JWT ──────────────────────────────────────────
// Protege rotas que exigem o usuário estar logado (OWASP A01)
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  // Token deve vir no header: "Authorization: Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Acesso não autorizado. Token ausente.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  const decoded = AuthService.verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
    return;
  }

  req.user = decoded;
  next();
}