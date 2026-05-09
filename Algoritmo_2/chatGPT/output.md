# Busca Dinâmica com Filtros no Servidor (TypeScript + SQL)

Este exemplo mostra como criar um endpoint no servidor que permite fazer buscas em uma tabela usando filtros dinâmicos, paginação e ordenação de forma segura.

O exemplo utiliza:

* Node.js
* TypeScript
* Express
* PostgreSQL
* Prisma ORM

---

# Estrutura do Projeto

```txt
src/
 ├── server.ts
 ├── routes/
 │    └── users.routes.ts
 ├── services/
 │    └── users.service.ts
 └── prisma/
      └── schema.prisma
```

---

# Instalação

## 1. Criar projeto

```bash
npm init -y
```

## 2. Instalar dependências

```bash
npm install express prisma @prisma/client zod
npm install -D typescript ts-node-dev @types/node @types/express
```

## 3. Inicializar TypeScript

```bash
npx tsc --init
```

## 4. Inicializar Prisma

```bash
npx prisma init
```

---

# Configuração do Banco

Arquivo `.env`

```env
DATABASE_URL="postgresql://postgres:senha@localhost:5432/meubanco"
```

---

# Schema Prisma

Arquivo `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  age       Int
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

---

# Criar Banco

```bash
npx prisma migrate dev --name init
```

---

# Cliente Prisma

Arquivo `src/prisma.ts`

```ts
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()
```

---

# Serviço de Busca Dinâmica

Arquivo `src/services/users.service.ts`

```ts
import { prisma } from '../prisma'
import { Prisma } from '@prisma/client'

interface SearchUsersParams {
  name?: string
  email?: string
  active?: boolean
  minAge?: number
  maxAge?: number
  page?: number
  limit?: number
  orderBy?: 'name' | 'email' | 'age' | 'createdAt'
  orderDirection?: 'asc' | 'desc'
}

export async function searchUsers(params: SearchUsersParams) {
  const {
    name,
    email,
    active,
    minAge,
    maxAge,
    page = 1,
    limit = 10,
    orderBy = 'createdAt',
    orderDirection = 'desc'
  } = params

  const where: Prisma.UserWhereInput = {}

  if (name) {
    where.name = {
      contains: name,
      mode: 'insensitive'
    }
  }

  if (email) {
    where.email = {
      contains: email,
      mode: 'insensitive'
    }
  }

  if (typeof active === 'boolean') {
    where.active = active
  }

  if (minAge || maxAge) {
    where.age = {}

    if (minAge) {
      where.age.gte = minAge
    }

    if (maxAge) {
      where.age.lte = maxAge
    }
  }

  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [orderBy]: orderDirection
      }
    }),

    prisma.user.count({ where })
  ])

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}
```

---

# Rotas

Arquivo `src/routes/users.routes.ts`

```ts
import { Router } from 'express'
import { z } from 'zod'
import { searchUsers } from '../services/users.service'

const router = Router()

router.get('/users', async (req, res) => {
  const querySchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    active: z
      .enum(['true', 'false'])
      .transform(v => v === 'true')
      .optional(),

    minAge: z.coerce.number().optional(),
    maxAge: z.coerce.number().optional(),

    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),

    orderBy: z
      .enum(['name', 'email', 'age', 'createdAt'])
      .optional(),

    orderDirection: z
      .enum(['asc', 'desc'])
      .optional()
  })

  const params = querySchema.parse(req.query)

  const result = await searchUsers(params)

  return res.json(result)
})

export default router
```

---

# Servidor

Arquivo `src/server.ts`

```ts
import express from 'express'
import usersRoutes from './routes/users.routes'

const app = express()

app.use(express.json())

app.use(usersRoutes)

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000')
})
```

---

# Script de Desenvolvimento

Arquivo `package.json`

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts"
  }
}
```

---

# Executar Projeto

```bash
npm run dev
```

---

# Exemplos de Busca

## Buscar por nome

```http
GET /users?name=alex
```

## Buscar por email

```http
GET /users?email=gmail
```

## Buscar usuários ativos

```http
GET /users?active=true
```

## Buscar por faixa de idade

```http
GET /users?minAge=18&maxAge=30
```

## Paginação

```http
GET /users?page=2&limit=20
```

## Ordenação

```http
GET /users?orderBy=name&orderDirection=asc
```

## Combinando filtros

```http
GET /users?name=alex&active=true&minAge=18&maxAge=35
```

---

# Segurança

Este modelo evita problemas comuns:

* SQL Injection (Prisma utiliza queries parametrizadas)
* Campos inválidos em `orderBy`
* Tipos incorretos nos parâmetros
* Paginação sem limite
* Filtros inesperados

---

# Melhorias Recomendadas

Você pode evoluir este sistema adicionando:

* Cache com Redis
* Busca textual avançada
* Full-text search
* Elasticsearch
* Rate limiting
* Autenticação JWT
* Multi-column sorting
* Filtros aninhados
* Auditoria de buscas
* Soft delete
* Índices no banco de dados

---

# Exemplo de Índices PostgreSQL

```sql
CREATE INDEX idx_users_name ON "User"(name);
CREATE INDEX idx_users_email ON "User"(email);
CREATE INDEX idx_users_age ON "User"(age);
CREATE INDEX idx_users_active ON "User"(active);
```

Esses índices melhoram bastante a performance das buscas.
