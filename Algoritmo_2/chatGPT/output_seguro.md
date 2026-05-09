A forma mais segura de implementar buscas com filtros dinâmicos é:

* usar **query builder parametrizado**
* definir uma **whitelist de campos permitidos**
* validar operadores aceitos
* limitar paginação
* impedir SQL Injection
* evitar exposição de colunas sensíveis
* validar ordenação (`ORDER BY`) explicitamente
* aplicar rate limit/autorização no endpoint
* registrar auditoria de consultas suspeitas

Abaixo está uma implementação completa em **TypeScript + Express + Prisma + PostgreSQL** com foco em segurança seguindo boas práticas da OWASP.

---

# Estrutura esperada

```txt
src/
 ├── server.ts
 ├── routes/
 │    └── users.ts
 ├── services/
 │    └── dynamic-search.ts
 └── prisma/
      └── schema.prisma
```

---

# Exemplo de tabela

## Prisma Schema

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  age       Int?
  status    String
  createdAt DateTime @default(now())

  @@index([email])
  @@index([status])
}
```

---

# Instalação

```bash
npm install express prisma @prisma/client zod helmet express-rate-limit
npm install -D typescript ts-node-dev @types/express
```

---

# Endpoint seguro com filtros dinâmicos

## `routes/users.ts`

```ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../server";
import { buildUserSearchQuery } from "../services/dynamic-search";

const router = Router();

/**
 * Schema de validação
 */
const searchSchema = z.object({
  filters: z.array(
    z.object({
      field: z.string(),
      operator: z.enum([
        "eq",
        "contains",
        "gt",
        "gte",
        "lt",
        "lte",
        "in"
      ]),
      value: z.any()
    })
  ).max(20),

  page: z.number().min(1).default(1),

  limit: z.number()
    .min(1)
    .max(100)
    .default(20),

  orderBy: z.string().optional(),

  orderDirection: z.enum(["asc", "desc"]).optional()
});

router.post("/search", async (req, res) => {
  try {
    const parsed = searchSchema.parse(req.body);

    const {
      filters,
      page,
      limit,
      orderBy,
      orderDirection
    } = parsed;

    const where = buildUserSearchQuery(filters);

    /**
     * Whitelist de ordenação
     */
    const allowedOrderFields = [
      "name",
      "email",
      "createdAt",
      "age",
      "status"
    ];

    const safeOrderBy = allowedOrderFields.includes(orderBy || "")
      ? orderBy
      : "createdAt";

    const users = await prisma.user.findMany({
      where,

      skip: (page - 1) * limit,

      take: limit,

      orderBy: {
        [safeOrderBy]: orderDirection || "desc"
      },

      /**
       * Evita exposição de dados sensíveis
       */
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        status: true,
        createdAt: true
      }
    });

    const total = await prisma.user.count({ where });

    return res.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error(error);

    return res.status(400).json({
      error: "Invalid search request"
    });
  }
});

export default router;
```

---

# Construção segura dos filtros

## `services/dynamic-search.ts`

```ts
type Filter = {
  field: string;
  operator:
    | "eq"
    | "contains"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in";

  value: any;
};

/**
 * Campos permitidos para busca
 */
const allowedFields = {
  id: "string",
  name: "string",
  email: "string",
  age: "number",
  status: "string",
  createdAt: "date"
};

export function buildUserSearchQuery(filters: Filter[]) {
  const where: any = {};

  for (const filter of filters) {

    /**
     * Impede busca em colunas arbitrárias
     */
    if (!(filter.field in allowedFields)) {
      continue;
    }

    const fieldType =
      allowedFields[
        filter.field as keyof typeof allowedFields
      ];

    /**
     * Sanitização básica por tipo
     */
    validateValueType(fieldType, filter.value);

    switch (filter.operator) {

      case "eq":
        where[filter.field] = {
          equals: filter.value
        };
        break;

      case "contains":

        /**
         * Apenas strings podem usar contains
         */
        if (fieldType !== "string") {
          continue;
        }

        where[filter.field] = {
          contains: String(filter.value),
          mode: "insensitive"
        };

        break;

      case "gt":
        where[filter.field] = {
          gt: filter.value
        };
        break;

      case "gte":
        where[filter.field] = {
          gte: filter.value
        };
        break;

      case "lt":
        where[filter.field] = {
          lt: filter.value
        };
        break;

      case "lte":
        where[filter.field] = {
          lte: filter.value
        };
        break;

      case "in":

        if (!Array.isArray(filter.value)) {
          continue;
        }

        where[filter.field] = {
          in: filter.value
        };

        break;
    }
  }

  return where;
}

function validateValueType(
  fieldType: string,
  value: any
) {

  switch (fieldType) {

    case "number":

      if (typeof value !== "number") {
        throw new Error("Invalid number");
      }

      break;

    case "string":

      if (typeof value !== "string") {
        throw new Error("Invalid string");
      }

      /**
       * Evita payloads gigantes
       */
      if (value.length > 255) {
        throw new Error("String too large");
      }

      break;

    case "date":

      if (isNaN(Date.parse(value))) {
        throw new Error("Invalid date");
      }

      break;
  }
}
```

---

# Configuração do servidor

## `server.ts`

```ts
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";

import usersRouter from "./routes/users";

export const prisma = new PrismaClient();

const app = express();

app.use(express.json());

/**
 * Headers de segurança
 */
app.use(helmet());

/**
 * Rate limit contra abuso
 */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300
  })
);

app.use("/users", usersRouter);

app.listen(3000, () => {
  console.log("Server running");
});
```

---

# Exemplo de request

## POST `/users/search`

```json
{
  "filters": [
    {
      "field": "name",
      "operator": "contains",
      "value": "alex"
    },
    {
      "field": "age",
      "operator": "gte",
      "value": 18
    }
  ],
  "page": 1,
  "limit": 10,
  "orderBy": "createdAt",
  "orderDirection": "desc"
}
```

---

# Exemplo de SQL Injection bloqueado

Payload malicioso:

```json
{
  "field": "name; DROP TABLE users"
}
```

Não funciona porque:

* existe whitelist de campos
* Prisma usa queries parametrizadas
* o campo não existe em `allowedFields`

---

# Melhorias avançadas recomendadas

## 1. Multi-tenant isolation

Adicionar:

```ts
where.companyId = req.user.companyId;
```

Evita vazamento entre clientes.

---

## 2. ACL por campo

Permitir filtros apenas conforme perfil:

```ts
if (!req.user.isAdmin && filter.field === "salary") {
  continue;
}
```

---

## 3. Proteção contra queries pesadas

Limitar:

* quantidade de filtros
* tamanho do texto
* operadores complexos
* paginação máxima

---

## 4. Índices no banco

Crie índices nos campos pesquisáveis:

```sql
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

---

# Problemas OWASP mitigados

| Risco                  | Mitigação              |
| ---------------------- | ---------------------- |
| SQL Injection          | Prisma + whitelist     |
| Mass Assignment        | `select` explícito     |
| DoS por paginação      | limite máximo          |
| Information Disclosure | campos controlados     |
| Query abuse            | rate limit             |
| Injection em ORDER BY  | whitelist              |
| Large payloads         | validação Zod          |
| Unsafe filtering       | operadores controlados |

---

# Arquitetura recomendada para produção

Para sistemas maiores:

```txt
Controller
  -> Validation Layer
      -> Authorization Layer
          -> Query Builder Seguro
              -> Repository
                  -> Prisma
```

---

# Alternativa ainda mais segura

Se quiser máxima segurança e padronização:

* GraphQL + schema restrito
* Elasticsearch/OpenSearch
* Query DSL própria
* Specification Pattern
* CQRS

Porque filtros dinâmicos SQL tendem a crescer em complexidade rapidamente.
