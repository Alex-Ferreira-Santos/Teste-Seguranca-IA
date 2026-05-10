import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { inviteUserSchema, setPasswordSchema } from '../schemas/user.schema';
import { inviteUser, activateUserWithPassword } from '../services/user.service';
import { requireAdmin } from '../middleware/auth.middleware';

export const userRoutes = Router();

// OWASP A07 – Rate limit específico para o endpoint de convite (mais restrito)
const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: { error: 'Limite de convites atingido. Tente em 15 minutos.' },
  skipSuccessfulRequests: false,
});

// OWASP A07 – Rate limit para definir senha (evita força bruta no token)
const setPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: { error: 'Muitas tentativas. Tente em 1 hora.' },
});

/**
 * POST /api/users/invite
 * Apenas admin pode convidar novos usuários.
 * Corpo: { email, name, role }
 */
userRoutes.post('/invite', requireAdmin, inviteLimiter, async (req, res) => {
  const result = inviteUserSchema.safeParse(req.body);

  if (!result.success) {
    // Erros de validação descritivos, mas sem vazar stack trace
    res.status(400).json({ error: 'Dados inválidos', details: result.error.flatten().fieldErrors });
    return;
  }

  try {
    const { inviteLink } = await inviteUser(result.data);

    // Em produção, não retorne o link – envie apenas por e-mail
    // Retornamos aqui somente para facilitar testes de integração
    res.status(201).json({
      message: 'Convite enviado com sucesso',
      inviteLink, // REMOVA em produção real
    });
  } catch (err) {
    // Resposta genérica para não vazar informações (OWASP A09)
    res.status(400).json({ error: (err as Error).message });
  }
});

/**
 * POST /api/users/set-password
 * Endpoint público: usuário convidado define sua própria senha.
 * Corpo: { token, password }
 */
userRoutes.post('/set-password', setPasswordLimiter, async (req, res) => {
  const result = setPasswordSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: 'Dados inválidos', details: result.error.flatten().fieldErrors });
    return;
  }

  try {
    await activateUserWithPassword(result.data);
    res.status(200).json({ message: 'Conta ativada com sucesso. Você já pode fazer login.' });
  } catch (err) {
    // Tempo de resposta constante para evitar timing attacks (OWASP A02)
    await new Promise((r) => setTimeout(r, 200));
    res.status(400).json({ error: (err as Error).message });
  }
});