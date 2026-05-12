import express from "express";
import logger, { logError } from "./logger";
import { httpLogger } from "./httpLogger";
import { errorHandler, notFoundHandler, AppError } from "./errorHandler";

const app = express();

// ─── Middlewares ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(httpLogger); // Log de todas as requisições HTTP

// ─── Rotas de exemplo ──────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/users/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Simula busca no banco
    if (id === "0") {
      throw new AppError("Usuário não encontrado", 404);
    }

    logger.info("Usuário buscado com sucesso", { userId: id });
    res.json({ id, name: "João Silva" });
  } catch (err) {
    next(err); // repassa para o errorHandler
  }
});

app.post("/orders", async (req, res, next) => {
  try {
    // Exemplo de log com contexto de negócio
    logger.info("Pedido criado", {
      userId: req.body.userId,
      items: req.body.items?.length,
      total: req.body.total,
    });

    res.status(201).json({ orderId: "ord_123", status: "created" });
  } catch (err) {
    next(err);
  }
});

// ─── Captura de erros assíncronos fora do Express ─────────────────────────
process.on("uncaughtException", (err) => {
  logError(err, { context: "uncaughtException" });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logError(reason instanceof Error ? reason : new Error(String(reason)), {
    context: "unhandledRejection",
  });
});

// ─── Middlewares de erro (sempre por último) ───────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  logger.info(`Servidor iniciado`, { port: PORT, env: process.env.NODE_ENV ?? "development" });
});

export default app;