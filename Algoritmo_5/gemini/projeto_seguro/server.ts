import Fastify from 'fastify';
import argon2 from 'argon2';
import { z } from 'zod';
import { randomBytes, createHash } from 'crypto';

const server = Fastify({ logger: true });

// Simulação de Banco de Dados
const db = {
  users: [] as any[],
  tokens: [] as any[]
};

// Schema de validação (OWASP: Previne Injeção e Mass Assignment)
const UserRegistrationSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(3)
});

const SetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(12).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^a-zA-Z0-9]/)
});

/**
 * 1. ROTA DE CONVITE (ADMIN)
 * Cria o usuário sem senha e gera um token seguro.
 */
server.post('/invite', async (request, reply) => {
  const { email, fullName } = UserRegistrationSchema.parse(request.body);

  // Gera um token aleatório de alta entropia
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  db.users.push({ email, fullName, active: false });
  db.tokens.push({
    tokenHash,
    email,
    expires: Date.now() + 1000 * 60 * 60 * 24 // 24 horas
  });

  // Na vida real, você enviaria o 'rawToken' por e-mail (HTTPS)
  return { 
    message: "Usuário convidado. Envie o token via link seguro.",
    debug_link: `https://seusite.com/setup-password?token=${rawToken}` 
  };
});

/**
 * 2. ROTA DE DEFINIÇÃO DE SENHA (USUÁRIO)
 * Onde o usuário finalmente define sua credencial.
 */
server.post('/set-password', async (request, reply) => {
  const { token, password } = SetPasswordSchema.parse(request.body);
  
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const tokenData = db.tokens.find(t => t.tokenHash === tokenHash && t.expires > Date.now());

  if (!tokenData) {
    return reply.status(400).send({ error: "Token inválido ou expirado." });
  }

  // Hashing robusto com Argon2id
  const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });

  // Atualiza o usuário e remove o token (Single Use Token)
  const user = db.users.find(u => u.email === tokenData.email);
  if (user) {
    user.password = hashedPassword;
    user.active = true;
  }
  
  const index = db.tokens.indexOf(tokenData);
  db.tokens.splice(index, 1);

  return { message: "Senha definida com sucesso! Você já pode fazer login." };
});

const start = async () => {
  try {
    await server.listen({ port: 3000 });
    console.log("🚀 Servidor de Identidade Seguro rodando em http://localhost:3000");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();