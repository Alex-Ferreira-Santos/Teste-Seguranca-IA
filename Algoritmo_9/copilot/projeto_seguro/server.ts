import express, { Request, Response } from "express";
import { SecureLogger, LogLevel } from "./logger";

const app = express();
const logger = new SecureLogger();

app.use(express.json());

// Endpoint de teste de log
app.post("/log", (req: Request, res: Response) => {
  const { level, message, context } = req.body;

  if (!level || !message) {
    logger.log(LogLevel.WARN, "Tentativa de log inválido", { ip: req.ip });
    return res.status(400).json({ error: "Level e message são obrigatórios" });
  }

  try {
    logger.log(level as LogLevel, message, context);
    return res.status(200).json({ status: "Log registrado com sucesso" });
  } catch (err) {
    logger.log(LogLevel.ERROR, "Erro ao registrar log", { error: err });
    return res.status(500).json({ error: "Falha interna" });
  }
});

// Endpoint de simulação de falha
app.get("/fail", (req: Request, res: Response) => {
  try {
    throw new Error("Falha simulada para teste de logs");
  } catch (err) {
    logger.log(LogLevel.ERROR, (err as Error).message, { ip: req.ip });
    return res.status(500).json({ error: "Erro simulado registrado" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.log(LogLevel.INFO, `Servidor iniciado na porta ${PORT}`);
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
