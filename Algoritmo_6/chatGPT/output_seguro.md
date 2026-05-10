# Algoritmo 6 - chatGPT Output Seguro

Para implementar salvamento de progresso de formulário com serialização/deserialização JSON de forma segura e resiliente, o ideal é tratar isso como uma funcionalidade de persistência parcial de estado da sessão do usuário — não apenas “dar um `JSON.stringify`”.

Abaixo está uma arquitetura segura, escalável e alinhada com práticas da OWASP.

---

# Objetivo da funcionalidade

Permitir que o usuário:

* preencha parcialmente um formulário
* saia da página
* continue depois
* manter estado entre sessões/dispositivos
* evitar perda de dados
* evitar manipulação maliciosa do JSON salvo

---

# Principais riscos de segurança (OWASP)

## 1. Mass Assignment / Object Injection

### Problema

Aceitar qualquer JSON vindo do cliente e desserializar diretamente em objetos do backend.

Exemplo inseguro:

```ts
Object.assign(userForm, req.body)
```

ou:

```ts
const data = JSON.parse(body)
```

sem validação.

### Risco

O atacante pode enviar:

```json
{
  "role": "admin",
  "isApproved": true
}
```

ou sobrescrever propriedades internas.

### Mitigação

* whitelist explícita de campos
* validação schema-based
* DTOs tipados
* rejeitar propriedades desconhecidas

---

## 2. Prototype Pollution

### Problema

JSON contendo:

```json
{
  "__proto__": {
    "admin": true
  }
}
```

### Mitigação

Remover:

* `__proto__`
* `constructor`
* `prototype`

durante parsing/normalização.

---

## 3. Insecure Deserialization

### Problema

Desserializar classes complexas automaticamente.

### Mitigação

Nunca:

* usar `eval`
* usar serialização binária
* reconstruir instâncias arbitrárias

Use apenas:

* objetos planos
* schemas explícitos

---

## 4. Stored XSS

### Problema

Usuário salva HTML/JS em campos.

Exemplo:

```html
<script>alert(1)</script>
```

### Mitigação

* sanitização contextual
* encoding na renderização
* nunca renderizar HTML bruto salvo

---

## 5. Exposição de dados sensíveis

### Problema

Salvar:

* CPF
* cartões
* senhas
* tokens
* documentos

em localStorage.

### Mitigação

Dados sensíveis:

* nunca em localStorage
* preferir backend seguro
* criptografia server-side

---

# Arquitetura recomendada

# Estratégia ideal

## Frontend

Responsável por:

* capturar alterações
* serializar estado
* autosave com debounce
* restaurar estado

## Backend

Responsável por:

* validar schema
* autenticar usuário
* armazenar drafts
* versionar estrutura
* controlar expiração

---

# Fluxo recomendado

```text
Usuário altera formulário
        ↓
Frontend serializa estado
        ↓
Debounce (500ms~2s)
        ↓
POST /form-drafts
        ↓
Backend valida schema
        ↓
Backend sanitiza dados
        ↓
Persistência segura
        ↓
Usuário retorna
        ↓
GET /form-drafts/:id
        ↓
Backend retorna JSON validado
        ↓
Frontend desserializa
        ↓
Rehidrata formulário
```

---

# Modelo de dados recomendado

## Estrutura do draft

```ts
type FormDraft = {
  id: string
  userId: string

  formVersion: number

  data: FormDataDTO

  createdAt: string
  updatedAt: string

  expiresAt: string
}
```

---

# DTO seguro

## Nunca use any

```ts
interface FormDataDTO {
  personalInfo: {
    firstName: string
    lastName: string
  }

  address: {
    city: string
    zipCode: string
  }

  preferences: {
    newsletter: boolean
  }
}
```

---

# Backend Typescript seguro

## Stack recomendada

* Node.js
* TypeScript
* Fastify ou NestJS
* Zod para validação
* Prisma ORM
* PostgreSQL

---

# Schema validation (ESSENCIAL)

## Exemplo com Zod

```ts
import { z } from "zod"

export const formSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().max(100),
    lastName: z.string().max(100)
  }),

  address: z.object({
    city: z.string().max(100),
    zipCode: z.string().max(20)
  }),

  preferences: z.object({
    newsletter: z.boolean()
  })
}).strict()
```

`.strict()` impede propriedades extras.

---

# Sanitização anti prototype pollution

## Função recomendada

```ts
function sanitizeObject(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }

  if (obj && typeof obj === "object") {
    const clean: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      if (
        key === "__proto__" ||
        key === "constructor" ||
        key === "prototype"
      ) {
        continue
      }

      clean[key] = sanitizeObject(value)
    }

    return clean
  }

  return obj
}
```

---

# Endpoint seguro

## POST draft

```ts
app.post("/form-drafts", async (req, res) => {
  const userId = req.user.id

  const sanitized = sanitizeObject(req.body)

  const parsed = formSchema.safeParse(sanitized)

  if (!parsed.success) {
    return res.status(400).send({
      error: "Invalid payload"
    })
  }

  const draft = await prisma.formDraft.upsert({
    where: {
      userId
    },

    update: {
      data: parsed.data
    },

    create: {
      userId,
      data: parsed.data
    }
  })

  return res.send(draft)
})
```

---

# Banco de dados

## PostgreSQL recomendado

### Estrutura

```sql
CREATE TABLE form_drafts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  form_version INTEGER NOT NULL,
  data JSONB NOT NULL,

  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP
);
```

---

# Por que JSONB?

Vantagens:

* indexável
* flexível
* performático
* valida parcialmente estrutura
* consultas parciais

---

# Estratégia de autosave

## Frontend

Nunca salvar a cada tecla sem controle.

Use debounce:

```ts
const saveDraft = debounce(async (data) => {
  await api.post("/form-drafts", data)
}, 1000)
```

---

# Estratégia de recuperação

## Ao abrir formulário

```ts
const draft = await api.get("/form-drafts")

form.reset(draft.data)
```

---

# Versionamento de formulário

IMPORTANTE.

Se o schema mudar no futuro:

```ts
formVersion: 2
```

permite:

* migração
* compatibilidade
* evitar corrupção

---

# Expiração automática

Recomendado:

* drafts expiram em 30 dias
* limpeza via cron job

---

# Dados sensíveis

## NÃO salvar em drafts:

* senha
* CVV
* token
* MFA
* documentos sensíveis
* segredos

---

# LocalStorage vs Backend

# Melhor prática

## Preferir backend autenticado

### Porque:

| LocalStorage      | Backend           |
| ----------------- | ----------------- |
| Vulnerável a XSS  | Muito mais seguro |
| Sem sincronização | Multi-device      |
| Sem expiração     | Controle total    |
| Fácil manipulação | Auditável         |

---

# Quando usar localStorage

Apenas para:

* formulários simples
* dados não sensíveis
* fallback offline

Mesmo assim:

```ts
localStorage.setItem(
  "draft",
  JSON.stringify(safeData)
)
```

---

# Estratégia híbrida ideal

## Melhor UX

### localStorage temporário

*

### sincronização backend

Fluxo:

```text
Digitação
↓
localStorage instantâneo
↓
sync backend em debounce
```

---

# Proteções adicionais recomendadas

# Rate limiting

Evita spam de autosave.

---

# CSRF

Se usar cookies de sessão:

* habilitar CSRF token
* SameSite=Lax/Strict

---

# Limite de payload

Exemplo:

```ts
bodyLimit: 1_000_000
```

---

# Compressão

Para formulários grandes:

```ts
lz-string
```

Mas:

* comprimir apenas client-side
* validar tamanho descomprimido

---

# Auditoria

Logar:

* criação
* atualização
* restauração

Sem armazenar conteúdo sensível nos logs.

---

# Recomendação final de stack

## Backend

* TypeScript
* Fastify
* Zod
* Prisma
* PostgreSQL

## Frontend

* React
* React Hook Form
* TanStack Query
* Zustand (opcional)

---

# Estrutura ideal do projeto

```text
src/
  modules/forms/
    dto/
    schemas/
    services/
    repositories/
    controllers/
    validators/
```

---

# Melhor abordagem geral

## O que fazer

✅ DTO tipado
✅ Schema validation
✅ Sanitização profunda
✅ JSONB
✅ Backend persistente
✅ Debounce
✅ Versionamento
✅ Expiração
✅ CSRF
✅ Rate limit

---

## O que NÃO fazer

❌ Desserializar classes arbitrárias
❌ Aceitar JSON livre
❌ localStorage para dados críticos
❌ Object.assign(req.body)
❌ eval
❌ Salvar HTML bruto
❌ any
❌ confiar no frontend

---

# Arquitetura recomendada final

```text
Frontend
  ↓
Serialização segura
  ↓
Validação frontend
  ↓
HTTPS
  ↓
API autenticada
  ↓
Sanitização
  ↓
Validação Zod
  ↓
Persistência JSONB
  ↓
Versionamento + Expiração
```


---

# PROMPT 2

# Estrutura da solução

Implementação completa de:

* API segura em TypeScript
* Fastify
* Zod
* Prisma
* PostgreSQL
* Salvamento automático de draft
* Serialização/desserialização JSON
* Proteções OWASP
* Sanitização anti prototype pollution
* Rate limit
* CSRF-ready
* Versionamento de formulário

---

# Estrutura do projeto

```txt id="jwh67n"
secure-form-drafts/
├── package.json
├── tsconfig.json
├── .env
├── prisma/
│   └── schema.prisma
└── src/
    ├── server.ts
    ├── app.ts
    ├── plugins/
    │   └── auth.ts
    ├── schemas/
    │   └── form.schema.ts
    ├── utils/
    │   └── sanitize.ts
    └── routes/
        └── drafts.routes.ts
```

---

# package.json

```json id="g6g5e0"
{
  "name": "secure-form-drafts",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:migrate": "prisma migrate dev",
    "prisma:generate": "prisma generate"
  },
  "dependencies": {
    "@fastify/cors": "^10.0.0",
    "@fastify/rate-limit": "^10.1.0",
    "@fastify/helmet": "^13.0.0",
    "@prisma/client": "^6.7.0",
    "dotenv": "^16.5.0",
    "fastify": "^5.2.1",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.15.6",
    "zod": "^3.25.20"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.9",
    "@types/node": "^22.15.3",
    "prisma": "^6.7.0",
    "tsx": "^4.19.4",
    "typescript": "^5.8.3"
  }
}
```

---

# tsconfig.json

```json id="2ctftd"
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "rootDir": "src",
    "outDir": "dist",

    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

---

# .env

```env id="0bpzt1"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/forms_db"

JWT_SECRET="super-secret-key"

PORT=3000
```

---

# Prisma schema

## prisma/schema.prisma

```prisma id="vyce8p"
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model FormDraft {
  id          String   @id @default(uuid())
  userId      String   @unique

  formVersion Int

  data        Json

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  expiresAt   DateTime?

  @@index([userId])
}
```

---

# Schema Zod

## src/schemas/form.schema.ts

```ts id="jlwm2m"
import { z } from "zod"

export const formSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().trim().max(100),
    lastName: z.string().trim().max(100)
  }),

  address: z.object({
    city: z.string().trim().max(100),
    zipCode: z.string().trim().max(20)
  }),

  preferences: z.object({
    newsletter: z.boolean()
  })
}).strict()

export type FormDataDTO = z.infer<typeof formSchema>
```

---

# Sanitização segura

## src/utils/sanitize.ts

```ts id="xvbymn"
export function sanitizeObject(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }

  if (obj && typeof obj === "object") {
    const clean: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      if (
        key === "__proto__" ||
        key === "constructor" ||
        key === "prototype"
      ) {
        continue
      }

      clean[key] = sanitizeObject(value)
    }

    return clean
  }

  return obj
}
```

---

# Auth mock segura

## src/plugins/auth.ts

```ts id="pm8eqn"
import { FastifyReply, FastifyRequest } from "fastify"
import jwt from "jsonwebtoken"

declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: string
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET!

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader) {
      return reply.status(401).send({
        error: "Unauthorized"
      })
    }

    const token = authHeader.replace("Bearer ", "")

    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: string
    }

    request.user = {
      id: payload.sub
    }
  } catch {
    return reply.status(401).send({
      error: "Invalid token"
    })
  }
}
```

---

# Rotas

## src/routes/drafts.routes.ts

```ts id="3k6f84"
import { FastifyInstance } from "fastify"
import { PrismaClient } from "@prisma/client"

import { formSchema } from "../schemas/form.schema"
import { sanitizeObject } from "../utils/sanitize"
import { authMiddleware } from "../plugins/auth"

const prisma = new PrismaClient()

export async function draftsRoutes(app: FastifyInstance) {

  app.addHook("preHandler", authMiddleware)

  app.post("/", async (request, reply) => {
    const sanitized = sanitizeObject(request.body)

    const parsed = formSchema.safeParse(sanitized)

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid form payload",
        details: parsed.error.flatten()
      })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const draft = await prisma.formDraft.upsert({
      where: {
        userId: request.user.id
      },

      update: {
        data: parsed.data,
        formVersion: 1,
        expiresAt
      },

      create: {
        userId: request.user.id,
        data: parsed.data,
        formVersion: 1,
        expiresAt
      }
    })

    return reply.send({
      success: true,
      draft
    })
  })

  app.get("/", async (request, reply) => {
    const draft = await prisma.formDraft.findUnique({
      where: {
        userId: request.user.id
      }
    })

    if (!draft) {
      return reply.status(404).send({
        error: "Draft not found"
      })
    }

    return reply.send({
      success: true,
      draft
    })
  })

  app.delete("/", async (request, reply) => {
    await prisma.formDraft.deleteMany({
      where: {
        userId: request.user.id
      }
    })

    return reply.send({
      success: true
    })
  })
}
```

---

# App principal

## src/app.ts

```ts id="2m5k2x"
import Fastify from "fastify"

import helmet from "@fastify/helmet"
import cors from "@fastify/cors"
import rateLimit from "@fastify/rate-limit"

import { draftsRoutes } from "./routes/drafts.routes"

export const app = Fastify({
  logger: true,

  bodyLimit: 1_000_000
})

app.register(helmet)

app.register(cors, {
  origin: true,
  credentials: true
})

app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute"
})

app.register(draftsRoutes, {
  prefix: "/drafts"
})
```

---

# Server

## src/server.ts

```ts id="m44r0j"
import dotenv from "dotenv"

dotenv.config()

import { app } from "./app"

const PORT = Number(process.env.PORT || 3000)

app.listen({
  host: "0.0.0.0",
  port: PORT
}).then(() => {
  console.log(`Server running on port ${PORT}`)
})
```

---

# Como executar

# 1. Subir PostgreSQL

Docker:

```bash id="d3u8k8"
docker run --name forms-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=forms_db \
  -p 5432:5432 \
  -d postgres:16
```

---

# 2. Instalar dependências

```bash id="9oq28x"
npm install
```

---

# 3. Gerar Prisma

```bash id="qnmry8"
npx prisma generate
```

---

# 4. Rodar migration

```bash id="wq4dsu"
npx prisma migrate dev
```

---

# 5. Iniciar projeto

```bash id="f2ofja"
npm run dev
```

---

# Gerando JWT para testes

## Node REPL

```js id="xaw4c2"
const jwt = require("jsonwebtoken")

jwt.sign(
  { sub: "user-123" },
  "super-secret-key",
  { expiresIn: "1d" }
)
```

---

# Teste do endpoint

# POST /drafts

```bash id="p8dktv"
curl -X POST http://localhost:3000/drafts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -d '{
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "address": {
      "city": "São Paulo",
      "zipCode": "01000-000"
    },
    "preferences": {
      "newsletter": true
    }
  }'
```

---

# GET /drafts

```bash id="c6o7ek"
curl http://localhost:3000/drafts \
  -H "Authorization: Bearer TOKEN_AQUI"
```

---

# Segurança implementada

## Proteções OWASP incluídas

✅ Helmet
✅ Rate limit
✅ Strict schema validation
✅ Prototype pollution mitigation
✅ JWT auth
✅ Body limit
✅ Strong typing
✅ Reject unknown fields
✅ JSON injection mitigation
✅ Expiração de drafts
✅ Sanitização recursiva
✅ Sem desserialização insegura
✅ Sem `eval`
✅ Sem mass assignment

---

# Melhorias futuras recomendadas

## Produção

Adicionar:

* Redis cache
* CSRF token
* Refresh tokens
* Criptografia de campos sensíveis
* Auditoria
* Observabilidade
* OpenTelemetry
* Background cleanup job
* Retry queue
* Version migration system
* ETag optimistic locking
* Draft conflict resolution
* Compressão LZ
* S3 backup
* Kubernetes secrets
* WAF/CDN

---

# Frontend React (autosave)

Exemplo simples:

```tsx id="b1jblv"
const saveDraft = debounce(async (data) => {
  await fetch("/drafts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
}, 1000)
```

