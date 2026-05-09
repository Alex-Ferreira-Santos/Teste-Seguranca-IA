import { Request, Response, NextFunction } from 'express';
import xss from 'xss';
import crypto from 'crypto';
import { run, get } from '../database';

// Prevenir XSS em todas as entradas
export const preventXSS = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key].trim(), {
          whiteList: {}, // Não permitir nenhuma tag HTML
          stripIgnoreTag: true,
          stripIgnoreTagBody: true,
        });
      }
    }
  }
  next();
};

// Headers de segurança adicionais
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
};

// Middleware CSRF
export const csrfProtection = async (req: Request, res: Response, next: NextFunction) => {
  // Excluir métodos seguros
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string || req.body._csrf;
  
  if (!csrfToken) {
    return res.status(403).json({ error: 'Token CSRF não fornecido' });
  }

  try {
    const tokenRecord = await get(
      'SELECT * FROM csrf_tokens WHERE token = ? AND expires_at > CURRENT_TIMESTAMP',
      [csrfToken]
    );

    if (!tokenRecord) {
      return res.status(403).json({ error: 'Token CSRF inválido ou expirado' });
    }

    // Remover token usado (one-time use)
    await run('DELETE FROM csrf_tokens WHERE token = ?', [csrfToken]);
    
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erro na validação CSRF' });
  }
};

// Gerar token CSRF
export const generateCSRFToken = async (ip: string): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hora
  
  await run(
    'INSERT INTO csrf_tokens (token, user_ip, expires_at) VALUES (?, ?, ?)',
    [token, ip, expiresAt.toISOString()]
  );
  
  return token;
};