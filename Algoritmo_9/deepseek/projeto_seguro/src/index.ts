import { SecureLogger } from './core/Logger';
import { SecurityContext, LogLevel } from './types';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const logger = new SecureLogger();
  
  console.log('Secure Logging System Started');
  console.log('Environment:', process.env.NODE_ENV);
  
  // Exemplo de logging com diferentes níveis
  const context: SecurityContext = {
    userId: 'test-user-123',
    sessionId: 'session-456',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    requestId: 'req-789'
  };
  
  await logger.info('Application started successfully', context, {
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
  
  await logger.warn('Database connection pool is high', context, {
    poolSize: 85,
    maxPoolSize: 100
  });
  
  try {
    throw new Error('Test error with sensitive data like email@example.com and password=secret123');
  } catch (error) {
    await logger.error(
      error instanceof Error ? error.message : 'Unknown error',
      context,
      {
        error: error instanceof Error ? error : undefined,
        stack: error instanceof Error ? error.stack : undefined
      }
    );
  }
  
  await logger.debug('Debug information', context, {
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
  
  console.log('\nLogs written successfully!');
  console.log('Check the logs directory for log files');
  console.log('- logs/application-*.log - All logs');
  console.log('- logs/error-*.log - Error logs only');
  console.log('- logs/audit.log - Audit trail');
  
  setTimeout(async () => {
    await logger.destroy();
    process.exit(0);
  }, 1000);
}

if (require.main === module) {
  main().catch(console.error);
}

export { SecureLogger, SecurityContext, LogLevel };