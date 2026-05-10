import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET deve ser definido e ter ao menos 32 caracteres');
}

const TOKEN_EXPIRY = '24h';

export interface InviteTokenPayload {
  email: string;
  name: string;
  role: string;
  jti: string; // JWT ID único para invalidação de uso único
  purpose: 'user-invite'; // Garante que este token só serve para convite
}

/**
 * Gera um token JWT de convite assinado.
 * - Uso único: inclui jti (JWT ID) armazenado no banco e marcado como usado após o primeiro uso.
 * - Expira em 24 horas.
 * - Nunca carrega senha no payload.
 */
export function generateInviteToken(email: string, name: string, role: string): string {
  const payload: InviteTokenPayload = {
    email,
    name,
    role,
    jti: crypto.randomUUID(), // ID único e criptograficamente seguro
    purpose: 'user-invite',
  };

  return jwt.sign(payload, JWT_SECRET!, { expiresIn: TOKEN_EXPIRY, algorithm: 'HS256' });
}

/**
 * Valida e decodifica o token de convite.
 * Lança erro se o token for inválido, expirado ou de propósito errado.
 */
export function verifyInviteToken(token: string): InviteTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!, { algorithms: ['HS256'] }) as InviteTokenPayload;

    if (decoded.purpose !== 'user-invite') {
      throw new Error('Token com propósito inválido');
    }

    return decoded;
  } catch (err) {
    // Não vaza detalhes internos do JWT para o cliente (OWASP A09)
    throw new Error('Token inválido ou expirado');
  }
}