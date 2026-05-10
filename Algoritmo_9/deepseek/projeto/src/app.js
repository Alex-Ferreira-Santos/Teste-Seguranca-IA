const express = require('express');
const morgan = require('morgan');
const logger = require('./config/logger');
const { requestLogger, errorHandler, notFoundHandler, asyncHandler } = require('./middlewares/errorHandler');
const LogService = require('./services/logService');

const app = express();

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan integrado com Winston
const morganStream = {
    write: (message) => {
        logger.info(message.trim());
    }
};
app.use(morgan('combined', { stream: morganStream }));

// Custom request logger
app.use(requestLogger);

// Rotas de exemplo
app.get('/', (req, res) => {
    res.json({
        message: 'API com Sistema de Logs',
        endpoints: [
            '/users/:id',
            '/error-test',
            '/logs/stats'
        ]
    });
});

// Rota que pode gerar erro
app.get('/users/:id', asyncHandler(async (req, res) => {
    const userId = req.params.id;
    
    if (userId === 'error') {
        throw new Error('Erro simulado na busca do usuário');
    }
    
    if (userId === 'db-error') {
        const dbError = new Error('Falha na conexão com o banco de dados');
        dbError.code = 'DB_CONNECTION_ERROR';
        dbError.statusCode = 503;
        throw dbError;
    }
    
    // Simular usuário
    res.json({
        id: userId,
        name: `Usuário ${userId}`,
        email: `usuario${userId}@email.com`
    });
}));

// Rota de teste de erro validação
app.post('/users', (req, res, next) => {
    const { name, email } = req.body;
    
    if (!name || !email) {
        const error = new Error('Nome e email são obrigatórios');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        return next(error);
    }
    
    res.status(201).json({ message: 'Usuário criado', user: req.body });
});

// Rota para estatísticas de logs (protegida - adicionar autenticação)
app.get('/logs/stats', asyncHandler(async (req, res) => {
    const stats = await LogService.getErrorStats(7);
    res.json(stats);
}));

// Rota para buscar logs de erro de uma data específica
app.get('/logs/errors/:date', asyncHandler(async (req, res) => {
    const { date } = req.params;
    const logs = await LogService.getErrorLogs(date);
    res.json({ date, logs });
}));

// Rota que gera exceção não tratada
app.get('/error-test', (req, res) => {
    throw new Error('Erro de teste não tratado');
});

// Rota que gera promise rejection
app.get('/promise-error', asyncHandler(async (req, res) => {
    await Promise.reject(new Error('Erro em Promise'));
}));

// Middleware para rotas não encontradas
app.use(notFoundHandler);

// Middleware de erro global (sempre por último)
app.use(errorHandler);

// Capturar exceções não capturadas
process.on('uncaughtException', (error) => {
    logger.logError(error, { type: 'uncaughtException' });
    console.error('Exceção não capturada:', error);
    // Em produção, pode decidir se continua ou reinicia
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    logger.logError(reason, { type: 'unhandledRejection', promise });
    console.error('Promise rejection não tratada:', reason);
});

module.exports = app;