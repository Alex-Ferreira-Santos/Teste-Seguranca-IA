import winston from 'winston';
import 'winston-daily-rotate-file';

// Lista de campos sensíveis que nunca devem aparecer no log
const SENSITIVE_FIELDS = ['password', 'token', 'authorization', 'secret', 'card_number'];

// Helper para mascarar recursivamente objetos
const maskSensitiveData = (data: any): any => {
  if (typeof data !== 'object' || data === null) return data;
  
  const masked = { ...data };
  for (const key in masked) {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  return masked;
};

// Custom format para limpar Log Injection (CWE-117)
const sanitizeFormat = winston.format((info) => {
  const message = info.message as string;
  // Remove quebras de linha que poderiam ser usadas para forjar entradas de log
  info.message = message.replace(/[\n\r]/g, ' ');
  
  if (info.metadata) {
    info.metadata = maskSensitiveData(info.metadata);
  }
  return info;
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    sanitizeFormat(),
    winston.format.json() // JSON é o padrão ouro para análise de segurança
  ),
  transports: [
    // Rotação diária: evita que um log gigante derrube o servidor (DoS)
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d', // Retenção por 14 dias
      maxSize: '20m',
      zippedArchive: true,
    }),
    // Logs de erro em arquivo separado para resposta rápida
    new winston.transports.File({ 
      filename: 'logs/security-errors.log', 
      level: 'error',
      maxsize: 10000000 // 10MB
    })
  ],
});

// Em desenvolvimento, exibe no console de forma legível
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

export default logger;