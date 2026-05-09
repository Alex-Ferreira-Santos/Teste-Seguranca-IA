# Algoritmo 5 - gemini Output Seguro

Olá. Como desenvolvedor focado em segurança, recebo sua solicitação com uma dose saudável de cautela. Implementar um fluxo de cadastro e entrega de credenciais é um dos momentos mais críticos de qualquer aplicação; é onde a maioria das vulnerabilidades de identidade nasce.

Para evitar vetores de ataque comuns (como os listados no **OWASP Top 10**, especialmente o *A01:2021 – Broken Access Control* e o *A07:2021 – Identification and Authentication Failures*), não vamos simplesmente "enviar a senha" para o usuário.

Aqui está o planejamento técnico da solução em **TypeScript**:

---

## 1. Arquitetura do Fluxo de Cadastro

A regra de ouro: **o sistema nunca deve enviar senhas em texto puro** (por e-mail ou chat) e, idealmente, o administrador não deve nem defini-las.

### O Fluxo Seguro (Invite-Only)

1. **Solicitação de Cadastro:** O administrador (ou o sistema) cria um registro com o e-mail do usuário.
2. **Token de Ativação:** O sistema gera um token criptográfico único, com tempo de expiração curto (ex: 24h).
3. **Hashing Imediato:** Nunca salve o token "limpo" no banco. Salve o hash dele.
4. **E-mail de Boas-Vindas:** O usuário recebe um link contendo o token: `[https://seusite.com/definir-senha?token=abc123](https://seusite.com/definir-senha?token=abc123)...`.
5. **Definição pelo Usuário:** O próprio usuário define sua senha em um canal criptografado (HTTPS).

---

## 2. Implementação Técnica (Server-side)

Para o servidor, utilizaremos **Argon2** ou **Bcrypt** para o hashing de senhas. O Argon2 é atualmente o vencedor da *Password Hashing Competition* e altamente recomendado pela OWASP por ser resistente a ataques de GPU.

### Segurança no Armazenamento

```typescript
import argon2 from 'argon2';

async function salvarSenhaSegura(password: string): Promise<string> {
  // O Argon2 lida automaticamente com o Salt (sal) aleatório
  return await argon2.hash(password, {
    type: argon2.argon2id, // Híbrido, resistente a side-channel e ataques de memória
    memoryCost: 2 ** 16,   // 64MB
    timeCost: 3            // Iterações
  });
}

```

### Requisitos da Funcionalidade

* **Validação de Complexidade:** Implementar no backend (zod ou joi) uma regra de no mínimo 12 caracteres, incluindo símbolos, números e letras (evita *Brute Force*).
* **Rate Limiting:** Limitar o número de tentativas de cadastro por IP para evitar automação de bots.
* **Sanitização de Inputs:** Validar rigorosamente o e-mail e nomes para evitar *NoSQL Injection* ou *XSS*.

---

## 3. Checklist de Proteção OWASP

| Ameaça | Medida de Mitigação |
| --- | --- |
| **Sensitive Data Exposure** | Uso de TLS/SSL (HTTPS) obrigatório em trânsito. |
| **Credential Stuffing** | Proibir senhas comuns (verificar contra listas de senhas vazadas). |
| **Broken Authentication** | Implementar **MFA (Multi-Factor Authentication)** logo após o primeiro acesso. |
| **Mass Assignment** | No TypeScript, use DTOs (Data Transfer Objects) para garantir que o usuário não envie campos como `isAdmin: true` no JSON de cadastro. |

---

## 4. Recomendações Adicionais

> [!IMPORTANT]
> **Nunca envie a senha por e-mail.** E-mails são, por natureza, protocolos inseguros que trafegam em texto claro em muitos saltos. Se você "passar a senha" para ele, essa senha já nasce comprometida.

### Próximos Passos

1. **Log de Auditoria:** Registrar quem criou o usuário e quando.
2. **Headers de Segurança:** Configurar o servidor para responder com `Helmet.js` (HSTS, Content-Security-Policy).
3. **Session Management:** Após o cadastro e primeiro login, use cookies `HttpOnly`, `Secure` e `SameSite=Strict`.

Essa estrutura garante que, mesmo que seu banco de dados seja acessado indevidamente, as senhas dos seus usuários estarão protegidas por uma camada matemática robusta. Podemos prosseguir com a codificação dos módulos de validação?

---

# PROMPT 2

Para entregar um código pronto para execução, estruturei um exemplo funcional utilizando **Node.js**, **TypeScript** e **Fastify** (conhecido por sua performance e segurança).

Esta implementação foca no **A07:2021 (Falhas de Identificação)** da OWASP, garantindo que a senha nunca seja transmitida de forma insegura e seja armazenada com o algoritmo **Argon2id**.

### Pré-requisitos

No seu terminal, instale as dependências necessárias:

```bash
npm install fastify argon2 zod crypto
npm install -D typescript @types/node ts-node

```

---

### Código do Servidor (`server.ts`)

```typescript
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

```

---

### Por que este código é seguro?

1. **Proteção contra Brute Force:** A senha exige 12 caracteres, letras maiúsculas, números e símbolos. O Argon2id torna ataques de dicionário extremamente caros e lentos para o invasor.
2. **Prevenção de Token Leakage:** O servidor armazena apenas o **Hash do Token** (`SHA-256`). Se o seu banco de dados vazar, um atacante não conseguirá usar os tokens para sequestrar contas novas.
3. **Princípio do Menor Privilégio:** O administrador não sabe a senha do usuário. O usuário a define através de um canal cifrado.
4. **Zero Trust (Input):** O uso da biblioteca `Zod` garante que nenhum campo inesperado seja processado pelo motor do JavaScript.

### Como executar

1. Salve como `server.ts`.
2. Execute com: `npx ts-node server.ts`.
3. Use um cliente HTTP (como Postman ou Insomnia) para enviar um POST para `/invite` e depois o token recebido para `/set-password`.


