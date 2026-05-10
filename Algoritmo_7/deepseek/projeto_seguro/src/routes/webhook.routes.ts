// src/routes/webhook.routes.ts
import { Router, Request, Response } from 'express';
import { getDB } from '../database/database.js';
import { validateWebhookRegistration, validateApiKey } from '../middleware/validation.js';
import { WebhookWorkerService } from '../services/WebhookWorker.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const router = Router();
let workerService: WebhookWorkerService | null = null;

// Initialize worker service on first use
async function getWorkerService(): Promise<WebhookWorkerService> {
  if (!workerService) {
    workerService = new WebhookWorkerService();
  }
  return workerService;
}

const createWebhookLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '10'),
  message: { error: 'Too many webhook registrations, please try again later' }
});

const triggerLimiter = rateLimit({
  windowMs: 60000,
  max: 100,
  message: { error: 'Too many trigger requests' }
});

// Register new webhook
router.post('/webhooks', 
  validateApiKey,
  createWebhookLimiter,
  validateWebhookRegistration,
  async (req: Request, res: Response) => {
    try {
      const { url, eventType, timeout } = req.body;
      const userId = req.headers['x-user-id'] as string || 'anonymous';
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required in X-User-Id header' });
        return;
      }

      const webhookId = uuidv4();
      const secret = crypto.randomBytes(32).toString('hex');
      
      const db = await getDB();
      await db.run(
        `INSERT INTO webhooks (id, user_id, url, event_type, secret, timeout_ms, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [webhookId, userId, url, eventType, secret, timeout || 5000]
      );

      res.status(201).json({
        id: webhookId,
        secret: secret,
        message: 'Webhook registered successfully. Save this secret - it will not be shown again.'
      });
    } catch (error) {
      console.error('Error registering webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Trigger webhook event
router.post('/trigger/:eventType',
  validateApiKey,
  triggerLimiter,
  async (req: Request, res: Response) => {
    try {
      const { eventType } = req.params;
      const eventData = req.body;
      const userId = req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required in X-User-Id header' });
        return;
      }

      const db = await getDB();
      const webhooks = await db.all(
        `SELECT id FROM webhooks 
         WHERE user_id = ? AND event_type = ? AND is_active = 1`,
        [userId, eventType]
      );

      if (webhooks.length === 0) {
        res.status(404).json({ error: 'No active webhooks found for this event' });
        return;
      }

      const worker = await getWorkerService();
      
      // Queue webhook deliveries
      for (const webhook of webhooks) {
        await worker.addToQueue(webhook.id, eventData);
      }

      res.status(202).json({
        message: `Event ${eventType} queued for delivery`,
        webhooksTriggered: webhooks.length
      });
    } catch (error) {
      console.error('Error triggering webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get webhook delivery history
router.get('/webhooks/:webhookId/deliveries',
  validateApiKey,
  async (req: Request, res: Response) => {
    try {
      const { webhookId } = req.params;
      const userId = req.headers['x-user-id'] as string;

      const db = await getDB();
      
      // Verify ownership
      const webhook = await db.get(
        `SELECT id FROM webhooks WHERE id = ? AND user_id = ?`,
        [webhookId, userId]
      );

      if (!webhook) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }

      const deliveries = await db.all(
        `SELECT id, response_status, error_message, attempt_count, duration_ms, delivered_at, created_at
         FROM webhook_deliveries
         WHERE webhook_id = ?
         ORDER BY created_at DESC
         LIMIT 100`,
        [webhookId]
      );

      res.json({
        webhookId,
        deliveries
      });
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete webhook
router.delete('/webhooks/:webhookId',
  validateApiKey,
  async (req: Request, res: Response) => {
    try {
      const { webhookId } = req.params;
      const userId = req.headers['x-user-id'] as string;

      const db = await getDB();
      
      const result = await db.run(
        `DELETE FROM webhooks WHERE id = ? AND user_id = ?`,
        [webhookId, userId]
      );

      if (result.changes === 0) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;