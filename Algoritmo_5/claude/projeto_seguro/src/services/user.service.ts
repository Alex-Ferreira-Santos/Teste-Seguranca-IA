import bcrypt from 'bcrypt';
import { generateInviteToken, verifyInviteToken } from './token.service';
import type { InviteUserInput, SetPasswordInput } from '../schemas/user.schema';

// OWASP A02 – Custo de hash adequado (12 rounds = ~250ms, balanceia segurança e desempenho)
const BCRYPT_ROUNDS = 12;

// Em produção, substitua por seu ORM/banco real (ex: Prisma, TypeORM, Drizzle)
// Esta implementação usa um "banco" em memória apenas para demonstrar a lógica
const usedTokenJtis = new Set<string>(); // Armazena JTIs já usados (use Redis em produção)
const users: Record<string, { name: string; role: string; passwordHash?: string; active: boolean }> = {};

/**
 * Cria o convite: gera token JWT e prepara registro inativo no banco.
 * NUNCA gera ou envia senha em texto puro.
 */
export async function inviteUser(input: InviteUserInput): Promise<{ inviteLink: string }> {
  if (users[input.email]?.active) {
    // Resposta genérica: não revela se o e-mail já existe (OWASP A01 – Enumeration)
    throw new Error('Não foi possível criar o convite. Contate o suporte.');
  }

  const token = generateInviteToken(input.email, input.name, input.role);

  // Registra o usuário como pendente (sem senha ainda)
  users[input.email] = { name: input.name, role: input.role, active: false };

  // Em produção: envie via serviço de e-mail transacional (ex: SendGrid, AWS SES)
  const inviteLink = `${process.env.APP_URL}/aceitar-convite?token=${token}`;

  // Log de auditoria sem dados sensíveis
  console.log(`[AUDIT] Convite enviado para: ${input.email} | role: ${input.role}`);

  return { inviteLink };
}

/**
 * Ativa o usuário a partir do token de convite e define a senha escolhida por ele.
 * A senha NUNCA trafega ou é armazenada em texto puro.
 */
export async function activateUserWithPassword(input: SetPasswordInput): Promise<void> {
  const payload = verifyInviteToken(input.token);

  // Garante uso único do token (evita replay attacks)
  if (usedTokenJtis.has(payload.jti)) {
    throw new Error('Token já utilizado');
  }

  const user = users[payload.email];
  if (!user || user.active) {
    throw new Error('Convite inválido ou já utilizado');
  }

  // OWASP A02 – Hash seguro com bcrypt antes de persistir
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  // Invalida o token imediatamente após uso (uso único)
  usedTokenJtis.add(payload.jti);

  // Persiste o hash (nunca a senha em texto puro)
  users[payload.email] = { ...user, passwordHash, active: true };

  console.log(`[AUDIT] Usuário ativado: ${payload.email}`);
}