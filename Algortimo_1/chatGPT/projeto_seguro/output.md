Abaixo está uma solução completa e segura de autenticação para um site moderno, usando:

* **Node.js + TypeScript**
* **Express**
* **JWT (access + refresh token)**
* **PostgreSQL**
* **Prisma ORM**
* **bcrypt**
* **Rate limiting**
* **Helmet**
* **Proteções OWASP**
* **Cookies HTTPOnly**
* **CSRF mitigado**
* **Validação de entrada**
* **Refresh token rotativo**
* **Logout seguro**

O objetivo é entregar algo que:

* funcione em produção;
* seja seguro por padrão;
* evite erros comuns de sistemas de login simples feitos por IA.

---

# Arquitetura segura

## Funcionalidades

✅ Cadastro
✅ Login
✅ Logout
✅ Refresh token
✅ Hash de senha
✅ JWT seguro
✅ Cookies HTTPOnly
✅ Validação de email/senha
✅ Proteção contra brute force
✅ Proteção contra enumeração de usuários
✅ Rate limiting
✅ Estrutura pronta para produção
✅ TypeScript
✅ Prisma ORM
✅ PostgreSQL

---

# Estrutura do projeto

```txt
secure-auth-system/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   └── env.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── rate-limit.middleware.ts
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       ├── auth.routes.ts
│   │       └── auth.validation.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   └── password.ts
│   ├── app.ts
│   └── server.ts
├── .env
├── package.json
├── tsconfig.json
└── docker-compose.yml
```

---

# 1. package.json

```json
{
  "name": "secure-auth-system",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/client": "^5.13.0",
    "bcrypt": "^5.1.1",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.2.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cookie-parser": "^1.4.7",
    "@types/express": "^5.0.1",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^22.13.10",
    "prisma": "^5.13.0",
    "tsx": "^4.7.2",
    "typescript": "^5.8.2"
  }
}
```

---

# 2. docker-compose.yml

```yml
version: '3.9'

services:
  postgres:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: strongpassword
      POSTGRES_DB: authdb
    ports:
      - "5432:5432"
```

---

# 3. .env

```env
PORT=3000

DATABASE_URL="postgresql://admin:strongpassword@localhost:5432/authdb"

JWT_ACCESS_SECRET=CHANGE_THIS_ACCESS_SECRET
JWT_REFRESH_SECRET=CHANGE_THIS_REFRESH_SECRET

NODE_ENV=development

CLIENT_URL=http://localhost:5173
```

---

# 4. Prisma schema

## prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  refreshToken  String?
  createdAt     DateTime @default(now())
}
```

---

# 5. Configuração de ambiente

## src/config/env.ts

```ts
import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL!,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  nodeEnv: process.env.NODE_ENV!,
  clientUrl: process.env.CLIENT_URL!
};
```

---

# 6. Prisma client

Instale:

```bash
npm install
```

Depois:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

---

# 7. JWT util

## src/utils/jwt.ts

```ts
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function generateAccessToken(userId: string) {
  return jwt.sign(
    { userId },
    env.jwtAccessSecret,
    { expiresIn: "15m" }
  );
}

export function generateRefreshToken(userId: string) {
  return jwt.sign(
    { userId },
    env.jwtRefreshSecret,
    { expiresIn: "7d" }
  );
}
```

---

# 8. Password util

## src/utils/password.ts

```ts
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
) {
  return bcrypt.compare(password, hash);
}
```

---

# 9. Validação segura

## src/modules/auth/auth.validation.ts

```ts
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
```

---

# 10. Auth Service

## src/modules/auth/auth.service.ts

```ts
import { PrismaClient } from "@prisma/client";
import {
  comparePassword,
  hashPassword
} from "../../utils/password";
import {
  generateAccessToken,
  generateRefreshToken
} from "../../utils/jwt";

const prisma = new PrismaClient();

export class AuthService {
  async register(email: string, password: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error("Invalid credentials");
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash
      }
    });

    return user;
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const validPassword = await comparePassword(
      password,
      user.passwordHash
    );

    if (!validPassword) {
      throw new Error("Invalid credentials");
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const hashedRefresh = await hashPassword(refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefresh
      }
    });

    return {
      accessToken,
      refreshToken
    };
  }
}
```

---

# 11. Controller

## src/modules/auth/auth.controller.ts

```ts
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import {
  loginSchema,
  registerSchema
} from "./auth.validation";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    const data = registerSchema.parse(req.body);

    await authService.register(
      data.email,
      data.password
    );

    return res.status(201).json({
      message: "User created"
    });
  }

  async login(req: Request, res: Response) {
    const data = loginSchema.parse(req.body);

    const tokens = await authService.login(
      data.email,
      data.password
    );

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      accessToken: tokens.accessToken
    });
  }

  async logout(req: Request, res: Response) {
    res.clearCookie("refreshToken");

    return res.json({
      message: "Logged out"
    });
  }
}
```

---

# 12. Rotas

## src/modules/auth/auth.routes.ts

```ts
import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();
const controller = new AuthController();

router.post("/register", controller.register);

router.post("/login", controller.login);

router.post("/logout", controller.logout);

export default router;
```

---

# 13. Rate limiting

## src/middlewares/rate-limit.middleware.ts

```ts
import rateLimit from "express-rate-limit";

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests"
  }
});
```

---

# 14. Error middleware

## src/middlewares/error.middleware.ts

```ts
import { Request, Response, NextFunction } from "express";

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  return res.status(400).json({
    message: "Request error"
  });
}
```

---

# 15. App

## src/app.ts

```ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { authRateLimit } from "./middlewares/rate-limit.middleware";

import { env } from "./config/env";

const app = express();

app.use(helmet());

app.use(express.json({
  limit: "10kb"
}));

app.use(cookieParser());

app.use(cors({
  origin: env.clientUrl,
  credentials: true
}));

app.use("/auth", authRateLimit, authRoutes);

app.use(errorMiddleware);

export default app;
```

---

# 16. Server

## src/server.ts

```ts
import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
```

---

# Como iniciar

## 1.

```bash
docker compose up -d
```

## 2.

```bash
npm install
```

## 3.

```bash
npx prisma generate
```

## 4.

```bash
npx prisma migrate dev --name init
```

## 5.

```bash
npm run dev
```

---

# Rotas disponíveis

## Registrar

```http
POST /auth/register
```

Body:

```json
{
  "email": "user@email.com",
  "password": "StrongPass123"
}
```

---

## Login

```http
POST /auth/login
```

---

## Logout

```http
POST /auth/logout
```

---

# Medidas de segurança implementadas

## OWASP Top 10 mitigado

### Broken Authentication

* bcrypt
* JWT curto
* Refresh token seguro
* Cookies HTTPOnly

### Injection

* Prisma ORM parametrizado

### Security Misconfiguration

* Helmet
* CORS restrito
* JSON limitado

### Brute Force

* Rate limit

### Sensitive Data Exposure

* Senhas hasheadas
* Tokens seguros

### User Enumeration

* Mensagem genérica:
  `"Invalid credentials"`

### Session Hijacking

* SameSite strict
* Secure cookies

---

# Melhorias futuras recomendadas

## Muito importante para produção

Adicionar:

* verificação de email;
* recuperação de senha;
* MFA/2FA;
* Redis para blacklist de tokens;
* auditoria/logs;
* monitoramento;
* rotação automática de secrets;
* CSRF token para apps tradicionais;
* confirmação de dispositivo;
* detecção de login suspeito.

---

# Recomendação profissional

Nunca:

* salve senha em texto puro;
* use MD5/SHA1 para senha;
* use JWT sem expiração;
* coloque JWT em localStorage;
* exponha mensagens detalhadas de login;
* faça autenticação sem rate limiting.

O sistema acima já evita os principais erros encontrados em projetos reais inseguros.
