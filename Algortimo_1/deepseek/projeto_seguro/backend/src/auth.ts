import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import pool from './database';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

export interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

// Gerar tokens
export function generateTokens(userId: number, email: string) {
  const accessToken = jwt.sign(
    { id: userId, email },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  
  const refreshToken = jwt.sign(
    { id: userId, email },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  
  return { accessToken, refreshToken };
}

// Registrar tentativa de login
async function logSecurityEvent(userId: number | null, eventType: string, ip: string, userAgent: string) {
  await pool.query(
    'INSERT INTO security_logs (user_id, event_type, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
    [userId, eventType, ip, userAgent]
  );
}

// Middleware de autenticação
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Acesso negado' });
  }
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    req.user = user;
    next();
  });
}

// Função de login segura
export async function secureLogin(email: string, password: string, ip: string, userAgent: string) {
  const client = await pool.connect();
  
  try {
    // Buscar usuário
    const result = await client.query(
      'SELECT id, email, password_hash, login_attempts, locked_until FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      await logSecurityEvent(null, 'LOGIN_FAILED_USER_NOT_FOUND', ip, userAgent);
      throw new Error('Credenciais inválidas');
    }
    
    const user = result.rows[0];
    
    // Verificar bloqueio
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await logSecurityEvent(user.id, 'LOGIN_BLOCKED_ACCOUNT_LOCKED', ip, userAgent);
      throw new Error('Conta temporariamente bloqueada. Tente novamente mais tarde.');
    }
    
    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      // Incrementar tentativas
      const newAttempts = (user.login_attempts || 0) + 1;
      let lockedUntil = null;
      
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOCKOUT_TIME);
      }
      
      await client.query(
        'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
        [newAttempts, lockedUntil, user.id]
      );
      
      await logSecurityEvent(user.id, 'LOGIN_FAILED_WRONG_PASSWORD', ip, userAgent);
      throw new Error('Credenciais inválidas');
    }
    
    // Login bem sucedido - resetar tentativas
    await client.query(
      'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    await logSecurityEvent(user.id, 'LOGIN_SUCCESS', ip, userAgent);
    
    // Gerar tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);
    
    // Hash do refresh token antes de salvar
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await client.query(
      'UPDATE users SET refresh_token_hash = $1 WHERE id = $2',
      [hashedRefreshToken, user.id]
    );
    
    return { accessToken, refreshToken, user: { id: user.id, email: user.email } };
    
  } finally {
    client.release();
  }
}

// Refresh token
export async function refreshAccessToken(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as any;
    
    const result = await pool.query(
      'SELECT id, email, refresh_token_hash FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    const user = result.rows[0];
    const validRefreshToken = await bcrypt.compare(refreshToken, user.refresh_token_hash);
    
    if (!validRefreshToken) {
      throw new Error('Refresh token inválido');
    }
    
    // Gerar novo access token
    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '15m' }
    );
    
    return newAccessToken;
    
  } catch (error) {
    throw new Error('Refresh token inválido ou expirado');
  }
}

// Logout seguro
export async function secureLogout(userId: number) {
  await pool.query(
    'UPDATE users SET refresh_token_hash = NULL WHERE id = $1',
    [userId]
  );
}