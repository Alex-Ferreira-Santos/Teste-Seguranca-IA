import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserStore, User } from '../models/User';

// ─── CONFIGURAÇÕES DE SEGURANÇA ─────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'TROQUE_ESTA_CHAVE_EM_PRODUCAO_USE_UMA_LONGA_E_ALEATORIA';
const JWT_EXPIRES_IN = '1h';          // Token expira em 1 hora
const BCRYPT_ROUNDS = 12;             // Fator de custo do bcrypt (mínimo recomendado: 10-12)
const MAX_FAILED_ATTEMPTS = 5;        // Bloqueio após 5 tentativas falhas
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // Bloqueio de 15 minutos

export interface AuthResult {
  success: boolean;
  message: string;
  token?: string;
  user?: { id: string; email: string; lastLoginAt: Date | null };
}

export const AuthService = {

  // ── REGISTRO ──────────────────────────────────────────────────────────────
  async register(email: string, password: string): Promise<AuthResult> {
    // Verifica se e-mail já existe
    if (UserStore.emailExists(email)) {
      // Mensagem genérica: não revela se o e-mail existe (OWASP A01)
      return { success: false, message: 'Não foi possível criar a conta. Verifique os dados.' };
    }

    // Hash da senha com bcrypt (OWASP A02 - Cryptographic Failures)
    // bcrypt automaticamente gera e armazena o salt
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const newUser: User = {
      id: uuidv4(),
      email: email.toLowerCase().trim(),
      passwordHash,
      createdAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: null
    };

    UserStore.create(newUser);

    return {
      success: true,
      message: 'Conta criada com sucesso! Faça login para continuar.'
    };
  },

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<AuthResult> {
    const user = UserStore.findByEmail(email);

    // ── Verificar bloqueio de conta ────────────────────────────────────────
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return {
        success: false,
        message: `Conta temporariamente bloqueada. Tente novamente em ${remainingMin} minuto(s).`
      };
    }

    // ── Verificar credenciais ──────────────────────────────────────────────
    // IMPORTANTE: sempre execute bcrypt.compare mesmo se o usuário não existir
    // para evitar timing attacks (OWASP A07)
    const dummyHash = '$2a$12$dummyhashtopreventtimingattacksXXXXXXXXXXXXXXXX';
    const passwordToCompare = user ? user.passwordHash : dummyHash;
    const isPasswordValid = await bcrypt.compare(password, passwordToCompare);

    if (!user || !isPasswordValid) {
      // Incrementar tentativas falhas
      if (user) {
        const newAttempts = user.failedLoginAttempts + 1;
        const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;
        UserStore.update(user.id, {
          failedLoginAttempts: newAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null
        });
      }

      // Mensagem genérica: não revela qual dado está errado (OWASP A01)
      return { success: false, message: 'E-mail ou senha inválidos.' };
    }

    // ── Login bem-sucedido: resetar contadores ─────────────────────────────
    UserStore.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date()
    });

    // ── Gerar JWT ──────────────────────────────────────────────────────────
    // Payload mínimo: não inclua dados sensíveis no token (OWASP A02)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'login-system',
        audience: 'login-system-users'
      }
    );

    return {
      success: true,
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user.id,
        email: user.email,
        lastLoginAt: user.lastLoginAt
      }
    };
  },

  // ── VERIFICAR TOKEN ───────────────────────────────────────────────────────
  verifyToken(token: string): { userId: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'login-system',
        audience: 'login-system-users'
      }) as { userId: string; email: string };
      return decoded;
    } catch {
      return null;
    }
  }
};