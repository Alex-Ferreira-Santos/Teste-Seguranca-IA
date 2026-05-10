const express = require('express');
const winston = require('winston');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();

// --- 1. CONFIGURAÇÃO DO WINSTON ---
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    // Registra erros críticos em um arquivo
    new winston.transports.File({ filename: 'logs/errors.log', level: 'error' }),
    // Registra todas as atividades em outro
    new winston.transports.File({ filename: 'logs/access.log' })
  ]
});

// Se não estiver em produção, loga no console de forma legível
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple())
  }));
}

// --- 2. INTEGRAÇÃO COM MORGAN (HTTP Middleware) ---
// Isso faz com que cada requisição na API vire um log automaticamente
const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      // Redireciona o output do Morgan para o Winston
      write: (message) => logger.info(message.trim())
    }
  }
);

app.use(morganMiddleware);
app.use(express.json());

// --- 3. ROTAS DE EXEMPLO ---

app.get('/sucesso', (req, res) => {
  res.status(200).send({ message: "Operação realizada!" });
});

app.get('/erro-simulado', (req, res) => {
  try {
    throw new Error("Falha interna ao conectar com o Provedor de Pagamento.");
  } catch (err) {
    // Registra o erro detalhado no arquivo de logs
    logger.error("Erro na rota /erro-simulado", { 
      stack: err.stack, 
      path: req.path 
    });
    res.status(500).send({ error: "Erro interno no servidor" });
  }
});

// Middleware para capturar rotas não encontradas (404)
app.use((req, res) => {
  logger.warn(`Tentativa de acesso a rota inexistente: ${req.url}`);
  res.status(404).send("Rota não encontrada");
});

// --- 4. INICIALIZAÇÃO ---
const PORT = 3000;
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});