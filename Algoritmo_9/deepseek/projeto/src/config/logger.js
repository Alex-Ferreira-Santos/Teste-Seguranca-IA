const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

// Formato personalizado
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const logEntry = {
            timestamp,
            level,
            message,
            ...meta
        };
        if (stack) logEntry.stack = stack;
        return JSON.stringify(logEntry);
    })
);

// Formato para console (mais legível)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
    })
);

// Configuração dos transportes (rotação diária de arquivos)
const errorRotateTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/errors/%DATE%-error.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: customFormat
});

const combinedRotateTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/combined/%DATE%-combined.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: customFormat
});

// Transporte para exceções não capturadas
const exceptionRotateTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/exceptions/%DATE%-exceptions.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: customFormat
});

// Criação do logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    transports: [
        errorRotateTransport,
        combinedRotateTransport,
        new winston.transports.Console({
            format: consoleFormat,
            level: 'debug'
        })
    ],
    exceptionHandlers: [
        exceptionRotateTransport,
        new winston.transports.Console({
            format: consoleFormat
        })
    ],
    rejectionHandlers: [
        exceptionRotateTransport,
        new winston.transports.Console({
            format: consoleFormat
        })
    ],
    exitOnError: false
});

// Método especial para registrar falhas
logger.logError = (error, context = {}) => {
    const errorLog = {
        type: error.name || 'Error',
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode || 500,
        context,
        timestamp: new Date().toISOString()
    };
    
    logger.error(errorLog.message, errorLog);
    return errorLog;
};

module.exports = logger;