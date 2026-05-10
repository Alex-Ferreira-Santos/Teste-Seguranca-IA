const logger = require('../config/logger');

// Middleware para capturar erros async
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware de logging de requisições
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log da requisição
    logger.info(`Incoming Request`, {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        body: req.method === 'POST' ? req.body : undefined,
        query: req.query,
        params: req.params
    });
    
    // Capturar resposta
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - start;
        
        // Log da resposta
        logger.info(`Request Completed`, {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        });
        
        originalSend.call(this, data);
    };
    
    next();
};

// Middleware de erro global
const errorHandler = (err, req, res, next) => {
    // Log detalhado do erro
    const errorContext = {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.id,
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers
    };
    
    // Registrar falha
    const loggedError = logger.logError(err, errorContext);
    
    // Determinar status code
    const statusCode = err.statusCode || err.status || 500;
    
    // Resposta para o cliente
    const errorResponse = {
        success: false,
        message: err.message || 'Erro interno do servidor',
        code: err.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        path: req.url
    };
    
    // Adicionar stack trace apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        errorResponse.details = loggedError;
    }
    
    res.status(statusCode).json(errorResponse);
};

// Middleware para rotas não encontradas
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Rota não encontrada: ${req.method} ${req.url}`);
    error.statusCode = 404;
    error.code = 'ROUTE_NOT_FOUND';
    next(error);
};

module.exports = {
    asyncHandler,
    requestLogger,
    errorHandler,
    notFoundHandler
};