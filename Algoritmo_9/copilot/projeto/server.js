// Instale as dependências antes:
// npm init -y
// npm install express winston

const express = require('express');
const winston = require('winston');

const app = express();
const PORT = 3000;

// Configuração do logger com Winston
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} - ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'api.log' })
  ]
});

// Middleware para logar cada requisição
app.use((req, res, next) => {
  logger.info(`Requisição recebida: ${req.method} ${req.url}`);
  next();
});

// Rota de teste
app.get('/', (req, res) => {
  res.send('API funcionando com logs!');
});

// Rota que gera erro proposital
app.get('/erro', (req, res) => {
  try {
    throw new Error("Falha simulada na API");
  } catch (error) {
    logger.error(`Erro na rota /erro: ${error.message}`);
    res.status(500).send("Ocorreu um erro, verifique os logs.");
  }
});

// Inicialização do servidor
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});
