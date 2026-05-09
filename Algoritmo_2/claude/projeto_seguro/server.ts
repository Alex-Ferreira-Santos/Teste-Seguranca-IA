import express from "express";
import helmet from "helmet";
import { createPool, createSearchRouter, searchRateLimiter } from "./search.route";

const app = express();

/**
 * OWASP A05 – Helmet configura headers HTTP de segurança:
 *   Content-Security-Policy, X-Frame-Options, HSTS, etc.
 */
app.use(helmet());

/**
 * OWASP A04 – limita o tamanho do body para prevenir DoS.
 */
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));

const pool = createPool();
const searchRouter = createSearchRouter(pool);

/**
 * Rate limiting global na rota de busca.
 */
app.use("/api/search", searchRateLimiter, searchRouter);

/**
 * Health check (sem autenticação, sem dados sensíveis).
 */
app.get("/health", (_req, res) => res.json({ status: "ok" }));

/**
 * Handler global — nunca vaza stack traces para o cliente.
 * OWASP A09.
 */
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[unhandled]", err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;