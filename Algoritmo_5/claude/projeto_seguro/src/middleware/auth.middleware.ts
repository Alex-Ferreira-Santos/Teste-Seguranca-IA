import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Middleware que protege rotas que exigem autenticação de admin.
 * OWASP A01 – Controle de acesso quebrado: apenas admin pode convidar usuários.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Autenticação necessária' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256'],
    }) as { role?: string };

    if (decoded.role !== 'admin') {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    next();
  } catch {
    // Não vaza detalhes do erro de JWT (OWASP A09)
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}