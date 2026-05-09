Para implementar um endpoint de busca com filtros dinâmicos de forma **segura** em um servidor usando **TypeScript** (com Express e um banco relacional via `pg`), precisamos considerar as principais recomendações da **OWASP** para evitar vulnerabilidades como **SQL Injection**, **exposição de dados sensíveis**, e **validação insuficiente de entrada**.

Aqui está um planejamento e depois o código de exemplo:

---

## 🔒 Planejamento de Segurança

- **Validação de entrada**:  
  - Usar bibliotecas como `zod` ou `joi` para validar os filtros recebidos.  
  - Definir tipos esperados (string, number, date) e limites.

- **Prevenção de SQL Injection**:  
  - Nunca concatenar strings diretamente em queries.  
  - Usar **query parametrizada** (`$1`, `$2`, …).

- **Controle de campos permitidos**:  
  - Definir uma lista branca de colunas que podem ser filtradas.  
  - Ignorar qualquer campo não autorizado.

- **Paginação segura**:  
  - Evitar retornos massivos que podem causar DoS.  
  - Implementar `limit` e `offset` com valores máximos.

- **Tratamento de erros**:  
  - Nunca expor mensagens internas do banco.  
  - Retornar erros genéricos para o cliente.

---

## 🛠️ Código de Exemplo (TypeScript + Express + pg)

```typescript
import express, { Request, Response } from "express";
import { Pool } from "pg";
import { z } from "zod";

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Lista branca de colunas permitidas
const allowedFilters = ["name", "email", "status", "created_at"];

// Schema de validação
const searchSchema = z.object({
  filters: z.record(z.string(), z.string().or(z.number()).or(z.date())).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

app.post("/search", async (req: Request, res: Response) => {
  try {
    const parsed = searchSchema.parse(req.body);
    const { filters = {}, limit, offset } = parsed;

    const conditions: string[] = [];
    const values: any[] = [];

    Object.entries(filters).forEach(([key, value], index) => {
      if (allowedFilters.includes(key)) {
        conditions.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT id, name, email, status, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2};
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);
    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

---

## ✅ Benefícios desta abordagem

- **Seguro contra SQL Injection** (uso de parâmetros).  
- **Respeita OWASP**: validação, tratamento de erros, controle de entrada.  
- **Escalável**: suporta filtros dinâmicos sem comprometer segurança.  
- **Paginação obrigatória**: evita sobrecarga de dados.

---

Quer que eu expanda este exemplo para incluir **busca com operadores avançados** (como `LIKE`, intervalos de datas, maior/menor que), ou prefere manter apenas igualdade simples para máxima segurança?

--------

# PROMPT 2 (sem a parte de segurança)

Perfeito, Alex! Aqui está um código **completo e pronto para executar** em **TypeScript**, usando **Express** e **pg** (PostgreSQL). Ele já inclui validações, prevenção contra **SQL Injection**, e boas práticas recomendadas pela **OWASP**.

---

## 📦 Passos para rodar

1. Crie um novo projeto:
   ```bash
   mkdir secure-search-api && cd secure-search-api
   npm init -y
   npm install express pg zod
   npm install --save-dev typescript ts-node @types/node @types/express
   npx tsc --init
   ```

2. Configure sua variável de ambiente:
   ```bash
   export DATABASE_URL="postgres://user:password@localhost:5432/mydb"
   ```

3. Crie o arquivo `server.ts` com o código abaixo.

---

## 🛠️ Código pronto

```typescript
import express, { Request, Response } from "express";
import { Pool } from "pg";
import { z } from "zod";

const app = express();
app.use(express.json());

// Conexão segura com o banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
});

// Lista branca de colunas permitidas
const allowedFilters = ["name", "email", "status", "created_at"];

// Schema de validação
const searchSchema = z.object({
  filters: z.record(z.string(), z.string().or(z.number())).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

app.post("/search", async (req: Request, res: Response) => {
  try {
    const parsed = searchSchema.parse(req.body);
    const { filters = {}, limit, offset } = parsed;

    const conditions: string[] = [];
    const values: any[] = [];

    Object.entries(filters).forEach(([key, value], index) => {
      if (allowedFilters.includes(key)) {
        conditions.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT id, name, email, status, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2};
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);
    res.json({ data: result.rows });
  } catch (err) {
    console.error("Erro na busca:", err);
    res.status(400).json({ error: "Requisição inválida" });
  }
});

app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});
```

---

## ✅ Testando

- Inicie o servidor:
  ```bash
  npx ts-node server.ts
  ```

- Faça uma requisição:
  ```bash
  curl -X POST http://localhost:3000/search \
    -H "Content-Type: application/json" \
    -d '{"filters":{"status":"active"}, "limit":10, "offset":0}'
  ```

---

Esse código já está pronto para rodar e seguro contra **SQL Injection**, com **validação de entrada** e **paginação segura**.  

Quer que eu adicione suporte a **busca parcial com LIKE** para permitir filtros mais flexíveis (ex: buscar por nomes que começam com "Jo")?
