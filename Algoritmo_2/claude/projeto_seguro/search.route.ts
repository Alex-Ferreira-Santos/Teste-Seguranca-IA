import { Router, Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { Pool } from "pg";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

/**
 * Colunas permitidas para filtragem e ordenação.
 * OWASP A03 – evita SQL Injection por enumeração de colunas válidas.
 * NUNCA interpoler colunas dinamicamente sem essa allowlist.
 */
const ALLOWED_COLUMNS = [
  "id",
  "name",
  "email",
  "status",
  "created_at",
  "updated_at",
] as const;

type AllowedColumn = (typeof ALLOWED_COLUMNS)[number];

const ALLOWED_OPERATORS = ["eq", "neq", "lt", "lte", "gt", "gte", "like", "ilike"] as const;
type AllowedOperator = (typeof ALLOWED_OPERATORS)[number];

const SQL_OPERATOR_MAP: Record<AllowedOperator, string> = {
  eq:    "=",
  neq:   "<>",
  lt:    "<",
  lte:   "<=",
  gt:    ">",
  gte:   ">=",
  like:  "LIKE",
  ilike: "ILIKE",
};

/**
 * Schema Zod — valida e tipifica a query string.
 * OWASP A03 – rejeita entradas inválidas antes de qualquer operação DB.
 */
const FilterSchema = z.object({
  column:   z.enum(ALLOWED_COLUMNS),
  operator: z.enum(ALLOWED_OPERATORS),
  value:    z
    .string()
    .min(1, "value não pode ser vazio")
    .max(255, "value excede 255 caracteres"),
});

const SearchQuerySchema = z.object({
  filters: z
    .preprocess(
      (v) => {
        try {
          return typeof v === "string" ? JSON.parse(v) : v;
        } catch {
          return v; // deixa o Zod rejeitar na validação
        }
      },
      z.array(FilterSchema).max(10, "Máximo de 10 filtros por requisição")
    )
    .optional()
    .default([]),

  sort_by:  z.enum(ALLOWED_COLUMNS).optional().default("created_at"),
  sort_dir: z.enum(["asc", "desc"]).optional().default("desc"),

  page: z.preprocess(
    (v) => (v === undefined || v === "" ? 1 : Number(v)),
    z.number().int().min(1).max(1000)
  ),

  page_size: z.preprocess(
    (v) => (v === undefined || v === "" ? 20 : Number(v)),
    z.number().int().min(1).max(100)
  ),
});

type SearchQuery = z.infer<typeof SearchQuerySchema>;

// ─── Pool de conexões ────────────────────────────────────────────────────────

/**
 * OWASP A02 – credenciais nunca hardcoded; lidas de variáveis de ambiente.
 * Em produção use um secrets manager (AWS Secrets Manager, Vault, etc.).
 */
function createPool(): Pool {
  const required = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Variáveis de ambiente ausentes: ${missing.join(", ")}`);
  }

  return new Pool({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl:      process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
    max:      20,
    idleTimeoutMillis:    30_000,
    connectionTimeoutMillis: 5_000,
  });
}

// ─── Query builder parametrizado ─────────────────────────────────────────────

interface QueryResult {
  sql:    string;
  params: unknown[];
}

/**
 * Monta a query com placeholders ($1, $2, …) — NUNCA interpolação de string.
 * OWASP A03 – única forma de prevenir SQL Injection com certeza.
 */
function buildSearchQuery(
  table: string,
  { filters, sort_by, sort_dir, page, page_size }: SearchQuery
): QueryResult {
  const params: unknown[] = [];
  const conditions: string[] = [];

  for (const { column, operator, value } of filters) {
    // Colunas e operadores vêm da allowlist — seguro fazer string template aqui
    const sqlOp = SQL_OPERATOR_MAP[operator];
    let paramValue: unknown = value;

    if (operator === "like" || operator === "ilike") {
      // Escapa metacaracteres LIKE para prevenir wildcard injection
      paramValue = `%${value.replace(/[%_\\]/g, "\\$&")}%`;
    }

    params.push(paramValue);
    conditions.push(`"${column}" ${sqlOp} $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  // sort_by e sort_dir validados pelo Zod — allowlist garante segurança
  const orderClause = `ORDER BY "${sort_by}" ${sort_dir.toUpperCase()}`;

  // Paginação com OFFSET/LIMIT parametrizados
  params.push(page_size);
  const limitClause = `LIMIT $${params.length}`;

  params.push((page - 1) * page_size);
  const offsetClause = `OFFSET $${params.length}`;

  // COUNT em subquery separada reutiliza os mesmos params de filtro
  const filterParams = params.slice(0, conditions.length);
  const countWhere   = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const dataSql = `
    SELECT *
    FROM "${table}"
    ${where}
    ${orderClause}
    ${limitClause}
    ${offsetClause}
  `.trim();

  const countSql = `
    SELECT COUNT(*) AS total
    FROM "${table}"
    ${countWhere}
  `.trim();

  return { sql: dataSql, params, countSql: countSql, countParams: filterParams } as any;
}

// ─── Middleware de autenticação (exemplo JWT) ─────────────────────────────────

/**
 * OWASP A01 – Broken Access Control.
 * Substitua pela verificação real do seu IdP (Auth0, Cognito, Keycloak, etc.).
 */
function authenticate(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticação ausente" });
    return;
  }

  const token = auth.slice(7);

  // TODO: verificar assinatura JWT (jsonwebtoken.verify) e injetar req.user
  if (!token || token.length < 10) {
    res.status(401).json({ error: "Token inválido" });
    return;
  }

  next();
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

/**
 * OWASP A04 / A09 – limita requisições para mitigar brute-force e DoS.
 */
export const searchRateLimiter = rateLimit({
  windowMs:         60 * 1_000,  // 1 minuto
  max:              60,           // 60 req/min por IP
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: "Muitas requisições. Tente novamente em breve." },
});

// ─── Handler principal ────────────────────────────────────────────────────────

export function createSearchRouter(pool: Pool): Router {
  const router = Router();

  /**
   * GET /search/:table
   *
   * Query params:
   *   filters    – JSON: [{ column, operator, value }]
   *   sort_by    – coluna de ordenação (allowlist)
   *   sort_dir   – "asc" | "desc"
   *   page       – número da página (≥ 1)
   *   page_size  – itens por página (1–100)
   *
   * OWASP A03 – tabela também validada por allowlist
   */

  const ALLOWED_TABLES = ["users", "products", "orders"] as const;
  type AllowedTable = (typeof ALLOWED_TABLES)[number];

  router.get(
    "/:table",
    authenticate,
    async (req: Request, res: Response): Promise<void> => {
      // Valida tabela
      const table = req.params.table as AllowedTable;
      if (!ALLOWED_TABLES.includes(table)) {
        res.status(400).json({
          error:   "Tabela não permitida",
          allowed: ALLOWED_TABLES,
        });
        return;
      }

      // Valida e parseia query params
      let query: SearchQuery;
      try {
        query = SearchQuerySchema.parse(req.query);
      } catch (err) {
        if (err instanceof ZodError) {
          res.status(422).json({
            error:  "Parâmetros inválidos",
            issues: err.errors.map((e) => ({
              path:    e.path.join("."),
              message: e.message,
            })),
          });
          return;
        }
        throw err;
      }

      // Monta query parametrizada
      const { sql, params, countSql, countParams } = buildSearchQuery(table, query) as any;

      let client;
      try {
        client = await pool.connect();

        // Executa em transação somente-leitura
        await client.query("BEGIN READ ONLY");

        const [dataResult, countResult] = await Promise.all([
          client.query(sql, params),
          client.query(countSql, countParams),
        ]);

        await client.query("COMMIT");

        const total      = Number(countResult.rows[0].total);
        const totalPages = Math.ceil(total / query.page_size);

        res.json({
          data: dataResult.rows,
          pagination: {
            page:       query.page,
            page_size:  query.page_size,
            total,
            total_pages: totalPages,
            has_next:    query.page < totalPages,
            has_prev:    query.page > 1,
          },
        });
      } catch (err) {
        if (client) await client.query("ROLLBACK").catch(() => {});

        // OWASP A09 – loga o erro real internamente, mas nunca expõe detalhes ao cliente
        console.error("[search] DB error:", err);
        res.status(500).json({ error: "Erro interno ao processar a busca" });
      } finally {
        client?.release();
      }
    }
  );

  return router;
}

// ─── Bootstrap do servidor ────────────────────────────────────────────────────

export { createPool };