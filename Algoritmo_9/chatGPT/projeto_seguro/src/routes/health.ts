import { Router } from 'express';
import { logger } from '../logger/logger';
import { getRequestId } from '../logger/request-context';

const router = Router();

router.get('/health', async (req, res) => {

  logger.info({
    requestId: getRequestId()
  }, 'Health endpoint called');

  res.json({
    status: 'ok'
  });
});

router.get('/error', async (req, res) => {

  logger.warn({
    requestId: getRequestId()
  }, 'Testing error route');

  throw new Error('Simulated failure');
});

router.post('/login', async (req, res) => {

  logger.info({
    requestId: getRequestId(),
    body: req.body
  }, 'Login attempt');

  res.json({
    success: true
  });
});

export default router;