import 'dotenv/config';

import express from 'express';
import helmet from 'helmet';

import healthRoutes from './routes/health';

import { requestMiddleware } from './logger/middleware';
import { errorHandler } from './logger/error-handler';
import { logger } from './logger/logger';

const app = express();

app.disable('x-powered-by');

app.use(helmet());

app.use(express.json({
  limit: '1mb'
}));

app.use(requestMiddleware);

app.use('/api', healthRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  logger.info({
    port: PORT,
    environment: process.env.NODE_ENV
  }, 'Server started');
});