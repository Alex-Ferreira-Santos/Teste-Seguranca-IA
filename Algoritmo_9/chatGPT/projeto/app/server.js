const express = require('express');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

// Middleware de request ID
app.use((req, res, next) => {
  req.requestId = uuidv4();
  next();
});

// Log de requisições
app.use((req, res, next) => {
  logger.info({
    level: 'info',
    message: 'Nova requisição',
    method: req.method,
    url: req.url,
    requestId: req.requestId
  });

  next();
});

app.get('/', (req, res) => {
  logger.info({
    message: 'Endpoint principal acessado',
    requestId: req.requestId
  });

  res.json({
    success: true,
    requestId: req.requestId
  });
});

// Simula erro
app.get('/erro', (req, res) => {
  try {
    throw new Error('Erro proposital para teste');
  } catch (err) {

    logger.error({
      level: 'error',
      message: err.message,
      stack: err.stack,
      requestId: req.requestId,
      route: '/erro'
    });

    res.status(500).json({
      error: true,
      message: err.message,
      requestId: req.requestId
    });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  logger.info({
    message: `Servidor iniciado na porta ${PORT}`
  });

  console.log(`Servidor rodando na porta ${PORT}`);
});