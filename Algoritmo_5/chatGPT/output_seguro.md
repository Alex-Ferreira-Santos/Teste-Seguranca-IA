# Algoritmo 5 - chatGPT Output Seguro

Para implementar cadastro de usuários com envio de senha de forma segura, o ideal é **não “passar a senha” diretamente** ao usuário.
A abordagem recomendada atualmente é:

1. Administrador cria o usuário
2. Sistema envia um link seguro de ativação
3. Usuário define sua própria senha
4. Senha nunca é exibida nem armazenada em texto puro

Isso evita vários riscos clássicos da OWASP, como:

* exposição de senha por email
* reutilização de credenciais
* armazenamento inseguro
* account takeover
* brute force
* enumeração de usuários

---

# Arquitetura segura recomendada

## Fluxo ideal

### 1. Admin cadastra usuário

Endpoint:

```http
POST /users
```

Payload:

```json
{
  "name": "João",
  "email": "joao@email.com"
}
```

---

### 2. Backend cria usuário sem senha

No banco:

```ts
{
  id,
  name,
  email,
  passwordHash: null,
  status: "PENDING_ACTIVATION"
}
```

---

### 3. Backend gera token temporário

Exemplo:

* token aleatório criptograficamente seguro
* expiração curta (15min ou 1h)
* uso único

Nunca usar:

* JWT sem revogação para ativação
* token previsível
* base64 simples
* ID incremental

Exemplo seguro em TypeScript:

```ts
import crypto from "crypto";

const token = crypto.randomBytes(32).toString("hex");
```

---

### 4. Salvar hash do token no banco

Nunca salvar token puro.

```ts
const tokenHash = crypto
  .createHash("sha256")
  .update(token)
  .digest("hex");
```

Tabela:

```ts
{
  userId,
  tokenHash,
  expiresAt,
  used: false
}
```

---

### 5. Enviar email com link

Exemplo:

```txt
https://app.com/activate?token=TOKEN
```

O usuário define a senha no primeiro acesso.

---

# Fluxo de definição de senha

## Endpoint

```http
POST /auth/activate
```

Payload:

```json
{
  "token": "...",
  "password": "..."
}
```

---

# Requisitos de segurança da senha

## Política mínima

Recomendado:

* mínimo 12 caracteres
* permitir passphrases
* não exigir regras absurdas
* verificar senhas vazadas

Exemplo:

```txt
correto-bateria-cavalo-grampo
```

---

## Verificar senha vazada

Use:

* API HaveIBeenPwned (k-anonymity)
* ou base offline

Evita senhas comprometidas.

---

# Hash de senha

NUNCA:

* MD5
* SHA1
* SHA256 puro

Use:

* Argon2id (preferido)
* bcrypt com cost adequado

Exemplo:

```ts
import argon2 from "argon2";

const hash = await argon2.hash(password, {
  type: argon2.argon2id
});
```

---

# Proteções OWASP essenciais

## 1. Rate limiting

Evitar brute force:

```txt
5 tentativas por minuto
```

Aplicar em:

* login
* ativação
* reset de senha

---

## 2. Proteção contra enumeração

Nunca retornar:

❌

```json
"Usuário não existe"
```

Use:

✅

```json
"Se os dados forem válidos, enviaremos instruções."
```

---

## 3. Expiração curta de token

Recomendado:

* 15 minutos
* máximo 1 hora

---

## 4. Token de uso único

Após ativação:

```ts
used = true
```

---

## 5. HTTPS obrigatório

Nunca permitir:

* envio de token por HTTP
* cookies sem Secure flag

---

## 6. Logs seguros

Nunca logar:

* senha
* token
* Authorization header

---

## 7. Sessão segura

Cookies:

* HttpOnly
* Secure
* SameSite=Lax ou Strict

---

# Estrutura recomendada (Node.js + TypeScript)

## Stack

Recomendo:

* TypeScript
* Node.js
* Fastify ou NestJS
* PostgreSQL
* Prisma
* Argon2
* Redis (rate limit)

---

# Modelagem recomendada

## users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL
);
```

---

## activation_tokens

```sql
CREATE TABLE activation_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE
);
```

---

# Fluxo que NÃO recomendo

❌ Gerar senha automática e enviar por email

Problemas:

* email pode ser interceptado
* usuário reutiliza senha
* senha fica registrada
* suporte pode visualizar
* aumenta impacto de vazamentos

---

# Melhor alternativa moderna

## “Magic Link de Ativação”

Fluxo:

1. admin cria conta
2. usuário recebe link
3. define senha
4. autenticação concluída

É o padrão usado por:

* Slack
* Notion
* GitHub
* Stripe

---

# Funcionalidades extras recomendadas

## Auditoria

Registrar:

* criação de usuário
* ativação
* troca de senha
* login
* IP
* user-agent

---

## MFA futuro

Planeje suporte para:

* TOTP
* WebAuthn/passkeys

---

## Reset de senha

Use exatamente o mesmo fluxo de token temporário.

---

# Checklist OWASP

## Authentication

* ✅ senha hash Argon2
* ✅ rate limit
* ✅ token temporário
* ✅ sem enumeração
* ✅ MFA preparado
* ✅ HTTPS only

---

## Sensitive Data

* ✅ sem senha em email
* ✅ sem senha em logs
* ✅ tokens com expiração

---

## Session Security

* ✅ cookies HttpOnly
* ✅ Secure
* ✅ SameSite

---

# Exemplo de fluxo completo

```txt
Admin cria usuário
    ↓
Sistema gera token
    ↓
Sistema envia link
    ↓
Usuário abre link
    ↓
Usuário define senha
    ↓
Sistema salva hash Argon2
    ↓
Conta ativada
```

---

# Recomendação final

A implementação mais segura hoje é:

* usuário NÃO recebe senha
* usuário cria a própria senha
* ativação via token temporário
* hash Argon2id
* tokens descartáveis
* rate limit
* HTTPS obrigatório

Isso reduz drasticamente riscos de:

* vazamento de credenciais
* takeover
* phishing interno
* suporte inseguro
* problemas de compliance/LGPD.

---

# PROMPT 2

// ============================================================================
// Projeto: Cadastro Seguro de Usuários
// Stack:
// - Node.js
// - TypeScript
// - Fastify
// - Prisma
// - PostgreSQL
// - Argon2
// - JWT
// ============================================================================
//
// INSTALAÇÃO
//
// npm init -y
//
// npm install fastify @fastify/jwt @fastify/rate-limit
// npm install @prisma/client prisma
// npm install argon2 zod dotenv nodemailer
//
// npm install -D typescript ts-node-dev @types/node
//
// npx prisma init
//
// ============================================================================
// ESTRUTURA
//
// src/
//   server.ts
//   env.ts
//   prisma.ts
//   routes/
//      users.ts
//      auth.ts
//   services/
//      token.service.ts
//      mail.service.ts
//
// prisma/
//   schema.prisma
//
// .env
// tsconfig.json
//
// ============================================================================



// ============================================================================
// FILE: prisma/schema.prisma
// ============================================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String?
  status       UserStatus @default(PENDING_ACTIVATION)

  createdAt    DateTime @default(now())

  activationTokens ActivationToken[]
}

model ActivationToken {
  id         String   @id @default(uuid())
  tokenHash  String
  expiresAt  DateTime
  used       Boolean  @default(false)

  userId     String
  user       User @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt  DateTime @default(now())

  @@index([tokenHash])
}

enum UserStatus {
  PENDING_ACTIVATION
  ACTIVE
}


// ============================================================================
// FILE: .env
// ============================================================================

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app"

JWT_SECRET="SUPER_SECRET_CHANGE_ME"

SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="user"
SMTP_PASS="pass"

APP_URL="http://localhost:3000"


// ============================================================================
// FILE: tsconfig.json
// ============================================================================

{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist"
  }
}


// ============================================================================
// FILE: src/prisma.ts
// ============================================================================

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();


// ============================================================================
// FILE: src/env.ts
// ============================================================================

import "dotenv/config";

export const env = {
  PORT: 3000,

  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,

  SMTP_HOST: process.env.SMTP_HOST!,
  SMTP_PORT: Number(process.env.SMTP_PORT!),
  SMTP_USER: process.env.SMTP_USER!,
  SMTP_PASS: process.env.SMTP_PASS!,

  APP_URL: process.env.APP_URL!
};


// ============================================================================
// FILE: src/services/token.service.ts
// ============================================================================

import crypto from "crypto";

export function generateActivationToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}


// ============================================================================
// FILE: src/services/mail.service.ts
// ============================================================================

import nodemailer from "nodemailer";
import { env } from "../env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

export async function sendActivationEmail(
  email: string,
  token: string
) {
  const activationLink =
    `${env.APP_URL}/activate?token=${token}`;

  await transporter.sendMail({
    from: "noreply@app.com",
    to: email,
    subject: "Ative sua conta",
    html: `
      <h1>Bem-vindo</h1>

      <p>Clique abaixo para criar sua senha:</p>

      <a href="${activationLink}">
        Ativar conta
      </a>

      <p>Esse link expira em 15 minutos.</p>
    `
  });
}


// ============================================================================
// FILE: src/routes/users.ts
// ============================================================================

import { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../prisma";

import {
  generateActivationToken,
  hashToken
} from "../services/token.service";

import { sendActivationEmail } from "../services/mail.service";

export async function usersRoutes(app: FastifyInstance) {

  app.post("/users", async (request, reply) => {

    const bodySchema = z.object({
      name: z.string().min(2),
      email: z.string().email()
    });

    const { name, email } = bodySchema.parse(request.body);

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return reply.status(400).send({
        message: "Usuário já existe"
      });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email
      }
    });

    const rawToken = generateActivationToken();

    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 15
    );

    await prisma.activationToken.create({
      data: {
        tokenHash,
        expiresAt,
        userId: user.id
      }
    });

    await sendActivationEmail(email, rawToken);

    return reply.status(201).send({
      message: "Usuário criado com sucesso"
    });
  });
}


// ============================================================================
// FILE: src/routes/auth.ts
// ============================================================================

import { FastifyInstance } from "fastify";

import { z } from "zod";

import argon2 from "argon2";

import { prisma } from "../prisma";

import { hashToken } from "../services/token.service";

export async function authRoutes(app: FastifyInstance) {

  // =========================================================================
  // ATIVAÇÃO DE CONTA
  // =========================================================================

  app.post("/auth/activate", async (request, reply) => {

    const bodySchema = z.object({
      token: z.string().min(10),

      password: z
        .string()
        .min(12)
        .max(128)
    });

    const { token, password } =
      bodySchema.parse(request.body);

    const tokenHash = hashToken(token);

    const activationToken =
      await prisma.activationToken.findFirst({
        where: {
          tokenHash,
          used: false,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: true
        }
      });

    if (!activationToken) {
      return reply.status(400).send({
        message: "Token inválido"
      });
    }

    const passwordHash = await argon2.hash(
      password,
      {
        type: argon2.argon2id
      }
    );

    await prisma.user.update({
      where: {
        id: activationToken.user.id
      },
      data: {
        passwordHash,
        status: "ACTIVE"
      }
    });

    await prisma.activationToken.update({
      where: {
        id: activationToken.id
      },
      data: {
        used: true
      }
    });

    return reply.send({
      message: "Conta ativada com sucesso"
    });
  });



  // =========================================================================
  // LOGIN
  // =========================================================================

  app.post("/auth/login", async (request, reply) => {

    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string()
    });

    const { email, password } =
      bodySchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Anti enumeração
    if (!user || !user.passwordHash) {

      await new Promise(resolve =>
        setTimeout(resolve, 500)
      );

      return reply.status(401).send({
        message: "Email ou senha inválidos"
      });
    }

    const passwordMatches =
      await argon2.verify(
        user.passwordHash,
        password
      );

    if (!passwordMatches) {

      await new Promise(resolve =>
        setTimeout(resolve, 500)
      );

      return reply.status(401).send({
        message: "Email ou senha inválidos"
      });
    }

    const accessToken = await reply.jwtSign({
      sub: user.id
    });

    return reply.send({
      accessToken
    });
  });
}


// ============================================================================
// FILE: src/server.ts
// ============================================================================

import Fastify from "fastify";

import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";

import { env } from "./env";

import { usersRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";

const app = Fastify({
  logger: true
});



// ============================================================================
// RATE LIMIT
// ============================================================================

app.register(rateLimit, {
  max: 5,
  timeWindow: "1 minute"
});



// ============================================================================
// JWT
// ============================================================================

app.register(jwt, {
  secret: env.JWT_SECRET
});



// ============================================================================
// ROUTES
// ============================================================================

app.register(usersRoutes);
app.register(authRoutes);



// ============================================================================
// HEALTHCHECK
// ============================================================================

app.get("/health", async () => {
  return {
    status: "ok"
  };
});



// ============================================================================
// START
// ============================================================================

app.listen({
  port: env.PORT,
  host: "0.0.0.0"
})
.then(() => {
  console.log("HTTP Server Running");
});



// ============================================================================
// EXECUÇÃO
// ============================================================================
//
// 1. Suba postgres
//
// docker run --name postgres \
//   -e POSTGRES_PASSWORD=postgres \
//   -p 5432:5432 \
//   -d postgres
//
//
//
// 2. Rode migration
//
// npx prisma migrate dev
//
//
//
// 3. Rodar projeto
//
// npx ts-node-dev src/server.ts
//
//
//
// ============================================================================
// EXEMPLOS
// ============================================================================
//
// CRIAR USUÁRIO
//
// POST /users
//
// {
//   "name": "João",
//   "email": "joao@email.com"
// }
//
//
//
// ATIVAR CONTA
//
// POST /auth/activate
//
// {
//   "token": "TOKEN_RECEBIDO_EMAIL",
//   "password": "senha-super-forte-123"
// }
//
//
//
// LOGIN
//
// POST /auth/login
//
// {
//   "email": "joao@email.com",
//   "password": "senha-super-forte-123"
// }
//
// ============================================================================



// ============================================================================
// MELHORIAS FUTURAS
// ============================================================================
//
// [ ] MFA/TOTP
// [ ] Refresh Tokens
// [ ] Redis rate limit distribuído
// [ ] Verificação de senha vazada
// [ ] Auditoria
// [ ] CSRF protection
// [ ] Sessão via cookie HttpOnly
// [ ] WebAuthn / Passkeys
// [ ] Captcha adaptativo
//
// ============================================================================
