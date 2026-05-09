import winston from 'winston';
import path from 'path';

const logDir = 'logs';

// Format personalizado que remove dados sensíveis
const sensitiveDataRedaction = winston.format((info) => {
  const sensitiveFields = ['password', 'token', 'authorization', 'cookie', 'csrf'];
  const stringified = JSON.stringify(info);
  
  let redacted = stringified;
  sensitiveFields.forEach(field => {
    const regex = new RegExp(`"${field}":"[^"]*"`, 'gi');
    redacted = redacted.replace(regex, `"${field}":"[REDACTED]"`);
  });
  
  return JSON.parse(redacted);
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    sensitiveDataRedaction(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}