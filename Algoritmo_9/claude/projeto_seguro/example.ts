import express from "express";
import { createLogger, requestLogger, errorLogger, LogLevel } from "./logger/index.js";

// ── 1. Cria o logger ──────────────────────────────────────────────────────────
const logger = createLogger({
  service: "my-api",
  level: LogLevel.DEBUG,
  outputFile: "./logs/app.log", // Arquivo com rotação automática
  enableConsole: true,
});

// ── 2. Captura erros globais não tratados ─────────────────────────────────────
process.on("uncaughtException", (err) => {
  logger.fatal("UncaughtException — processo será encerrado", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal("UnhandledRejection", reason);
});

// ── 3. Configura Express ──────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: "1mb" })); // Limita payload — OWASP A05

// Middleware de log de requests (ANTES das rotas)
app.use(requestLogger(logger));

// ── 4. Exemplo de rota ────────────────────────────────────────────────────────
app.get("/users/:id", async (req, res, next) => {
  try {
    logger.info("Buscando usuário", { userId: req.params.id }, req.correlationId);

    // Simula busca
    const user = { id: req.params.id, name: "João" };

    logger.debug("Usuário encontrado", user, req.correlationId);
    res.json(user);
  } catch (err) {
    // Repassa para o errorLogger
    next(err);
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const { username } = req.body;
    // ⚠️ NUNCA logue req.body.password — o sanitizer cobre, mas evite passar o body inteiro
    logger.info("Tentativa de login", { username }, req.correlationId);

    // … lógica de autenticação …
    res.json({ token: "…" });
  } catch (err) {
    next(err);
  }
});

// Error handler (DEPOIS das rotas)
app.use(errorLogger(logger));

app.listen(3000, () => {
  logger.info("Servidor iniciado", { port: 3000 });
});