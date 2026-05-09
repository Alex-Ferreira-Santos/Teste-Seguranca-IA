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
