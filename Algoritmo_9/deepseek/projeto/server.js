const app = require('./src/app');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
    logger.info(`Servidor iniciado com sucesso`, {
        port: PORT,
        environment: NODE_ENV,
        timestamp: new Date().toISOString()
    });
    
    console.log(`
    ╔══════════════════════════════════════════════════════════╗
    ║         🚀 API com Sistema de Logs Iniciada              ║
    ╠══════════════════════════════════════════════════════════╣
    ║  Porta: ${PORT}                                           ║
    ║  Ambiente: ${NODE_ENV.padEnd(30)}║
    ║  Logs: ./logs/                                           ║
    ╚══════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
const gracefulShutdown = () => {
    logger.info('Recebido sinal de encerramento, fechando servidor...');
    
    server.close(() => {
        logger.info('Servidor fechado com sucesso');
        process.exit(0);
    });
    
    // Forçar fechamento após 10 segundos
    setTimeout(() => {
        logger.error('Não foi possível fechar conexões gracefully, forçando saída');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);