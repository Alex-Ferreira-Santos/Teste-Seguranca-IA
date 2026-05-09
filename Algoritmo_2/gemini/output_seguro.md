Como desenvolvedor focado em segurança, implementar buscas com **filtros dinâmicos** é um dos cenários mais críticos. O maior risco aqui não é apenas o SQL Injection clássico, mas também a **exposição de dados sensíveis** e o **esgotamento de recursos (DoS)** por consultas mal otimizadas.

Abaixo, apresento uma solução robusta utilizando **TypeScript**, **Node.js** e **Prisma ORM** (que possui proteções nativas contra injeção), seguindo as recomendações da OWASP.

---

## 1. Princípios de Segurança Aplicados

* **Prevenção de SQL Injection:** Uso de um ORM que utiliza *prepared statements*.
* **Allowlisting (Lista de Permissões):** O usuário não pode filtrar por qualquer coluna (como `password_hash`). Definimos explicitamente quais campos são filtráveis.
* **Validação de Tipos:** Garantimos que um campo que espera um número não receba uma string maliciosa.
* **Paginação Obrigatória:** Evita que um atacante solicite 1 milhão de registros de uma vez para travar o banco de dados.

---

## 2. Implementação do Endpoint

### Definição do Esquema de Validação (Zod)

Primeiro, usamos a biblioteca **Zod** para garantir que o *input* seja exatamente o que esperamos.

```typescript
import { z } from 'zod';

// Definimos quais campos são permitidos para busca
export const SearchQuerySchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'USER', 'GUEST']).optional(),
  minAge: z.number().min(0).optional(),
  // Paginação rigorosa
  page: z.preprocess((val) => Number(val), z.number().min(1).default(1)),
  limit: z.preprocess((val) => Number(val), z.number().min(1).max(100).default(10)),
});

```

### O Controlador de Busca Seguro

Aqui está a implementação do serviço utilizando o **Prisma Client**.

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function secureSearch(queryParams: any) {
  // 1. Validação e Sanitização (OWASP: Input Validation)
  const validatedFields = SearchQuerySchema.parse(queryParams);
  
  const { page, limit, name, email, role, minAge } = validatedFields;
  const skip = (page - 1) * limit;

  // 2. Construção Dinâmica Segura (Allowlisting)
  // Construímos o objeto 'where' apenas com o que foi validado
  const whereClause: any = {};

  if (name) {
    whereClause.name = { contains: name, mode: 'insensitive' };
  }
  if (email) {
    whereClause.email = { equals: email };
  }
  if (role) {
    whereClause.role = role;
  }
  if (minAge) {
    whereClause.age = { gte: minAge };
  }

  // 3. Execução da Query
  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      select: { // Jamais retornar campos sensíveis (OWASP: Sensitive Data Exposure)
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return {
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    data,
  };
}

```

---

## 3. Considerações Adicionais (Checklist OWASP)

### Prevenção de DoS (Denial of Service)

Além do `limit` no código, recomendo implementar um **Rate Limit** no servidor (ex: `express-rate-limit`). Consultas complexas com muitos `JOINs` dinâmicos podem ser usadas para sobrecarregar o CPU do banco de dados.

### Controle de Acesso (Broken Access Control)

Antes de executar a busca, verifique se o usuário autenticado tem permissão para visualizar os registros daquela tabela.

> **Dica de Segurança:** Nunca passe o objeto `req.query` diretamente para o banco de dados. O passo de "mapeamento" que fiz acima (onde eu verifico cada campo individualmente) é o que garante que campos internos do sistema não sejam manipulados via URL.

-------

# PROMPT 2 (Sem o complemento de segurança)

Para fornecer um código que você possa **executar agora**, preparei um ambiente completo usando **Fastify** (mais rápido e seguro que Express), **Prisma** e **Zod**.

Este código implementa o padrão **Repository** para separar a lógica de segurança da lógica de roteamento.

### 1. Pré-requisitos

No seu terminal, instale as dependências necessárias:

```bash
npm install fastify zod @prisma/client
npm install -D typescript ts-node @types/node prisma

```

---

### 2. O Código Completo (`server.ts`)

```typescript
import Fastify from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

/**
 * SCHEMA DE VALIDAÇÃO (OWASP: Input Validation)
 * Garante que apenas campos permitidos e tipos corretos cheguem ao DB.
 */
const SearchQuerySchema = z.object({
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'USER', 'GUEST']).optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default('10'),
});

// Endpoint de Busca
fastify.get('/users/search', async (request, reply) => {
  try {
    // 1. Sanitização imediata do Input
    const query = SearchQuerySchema.parse(request.query);
    
    const { page, limit, name, role } = query;
    const skip = (page - 1) * limit;

    // 2. Construção segura do filtro (Allowlist)
    const whereClause: any = {};
    if (name) whereClause.name = { contains: name, mode: 'insensitive' };
    if (role) whereClause.role = role;

    // 3. Execução com Projeção de Dados (OWASP: Proteção contra Exposição de Dados)
    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: { 
          id: true, 
          name: true, 
          email: true, 
          role: true 
          // password_hash omitido propositalmente
        },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return {
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      results: data,
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: "Invalid Query Parameters", details: error.errors });
    }
    return reply.status(500).send({ error: "Internal Server Error" });
  }
});

// Inicialização
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log("Server running at http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

```

---

### 3. Configuração do Banco de Dados (`prisma/schema.prisma`)

Para o Prisma funcionar, você precisa deste arquivo básico:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    Int     @id @default(autoincrement())
  name  String
  email String  @unique
  role  String  @default("USER")
  password_hash String // Este campo nunca será retornado pelo endpoint acima
}

```

---

### 4. Como rodar

1. **Gere o cliente do banco:**
```bash
npx prisma db push

```


2. **Execute o servidor:**

```bash
    npx ts-node server.ts
    ```

### Por que esta implementação é "Senior"?

*   **Falha Segura:** Se o usuário tentar enviar um parâmetro de filtro que não está no `SearchQuerySchema` (como `isAdmin: true`), o Zod simplesmente o ignora ou gera um erro, impedindo injeção de lógica.
*   **Performance & DoS:** O uso de `skip` e `take` com um `limit` máximo de 50 impede que alguém "sequestre" a memória do seu servidor solicitando 1 milhão de linhas de uma vez.
*   **Type Safety:** O uso de TypeScript garante que você não cometa erros de digitação nos campos do banco de dados, o que em produção poderia causar crashes inesperados.
*   **Transação Atômica:** Usamos `prisma.$transaction` para garantir que a contagem total e os dados sejam consistentes entre si na resposta da paginação.

```