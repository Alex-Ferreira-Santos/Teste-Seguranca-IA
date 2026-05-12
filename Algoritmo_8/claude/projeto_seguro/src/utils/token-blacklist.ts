/**
 * Blacklist de JWT IDs (jti) para suporte a logout e revogação imediata.
 * Em produção, usar Redis com TTL igual ao exp do token.
 *
 * OWASP A07 - Tokens JWT devem ser revogáveis (logout, troca de role, comprometimento).
 */

// Produção: substituir por cliente Redis
// import { redis } from './redis';

const _blacklist = new Set<string>();

export const tokenBlacklist = {
  has(jti: string): boolean {
    return _blacklist.has(jti);
  },

  async revoke(jti: string, _expiresAt: Date): Promise<void> {
    _blacklist.add(jti);
    // Redis: await redis.set(`jti:${jti}`, '1', 'EXAT', Math.floor(_expiresAt.getTime() / 1000));
  },

  async revokeAllForUser(_userId: string): Promise<void> {
    // Redis: await redis.del(`user_tokens:${_userId}`); (requer índice de tokens por usuário)
    // Esta operação é crítica para: troca de senha, troca de role, conta comprometida
  },
};
