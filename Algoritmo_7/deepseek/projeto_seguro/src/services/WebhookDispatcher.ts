// src/services/WebhookDispatcher.ts
import crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import { WebhookConfig, WebhookPayload } from '../types/webhook.types.js';
import { getDB } from '../database/database.js';
import { v4 as uuidv4 } from 'uuid';

export class WebhookDispatcher {
  private static instance: WebhookDispatcher;
  
  static getInstance(): WebhookDispatcher {
    if (!this.instance) {
      this.instance = new WebhookDispatcher();
    }
    return this.instance;
  }

  async dispatch(config: WebhookConfig, eventData: any): Promise<void> {
    const deliveryId = uuidv4();
    const startTime = Date.now();

    try {
      const payload: WebhookPayload = {
        eventType: config.eventType,
        data: eventData,
        timestamp: Date.now(),
        webhookId: config.id
      };

      const signature = this.generateSignature(payload, config.secret);
      const payloadString = JSON.stringify(payload);
      const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

      const response = await axios.post(config.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Id': config.id,
          'X-Delivery-Id': deliveryId,
          'User-Agent': 'SecureWebhook-System/1.0',
          'Accept': 'application/json',
          'Connection': 'close'
        },
        timeout: config.timeoutMs,
        signal: controller.signal,
        maxRedirects: 0,
        validateStatus: (status) => status < 600,
        decompress: true,
        maxBodyLength: 10 * 1024 * 1024 // 10MB max response
      });

      clearTimeout(timeoutId);

      await this.logDelivery(deliveryId, config.id, payloadHash, response.status, null, Date.now() - startTime);

    } catch (error) {
      clearTimeout(startTime);
      
      let errorMessage: string;
      let shouldRetry = false;

      if (axios.isAxiosError(error)) {
        errorMessage = error.code || error.message;
        
        // Determine if should retry
        if (!error.response) {
          shouldRetry = true; // Network error
        } else if (error.response.status >= 500 && error.response.status < 600) {
          shouldRetry = true; // Server error
        } else if (error.code === 'ECONNABORTED') {
          shouldRetry = true; // Timeout
        }
        
        await this.logDelivery(deliveryId, config.id, null, error.response?.status || null, errorMessage, Date.now() - startTime);
        
        if (shouldRetry) {
          throw new Error(`RETRY_NEEDED:${errorMessage}`);
        }
      } else {
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await this.logDelivery(deliveryId, config.id, null, null, errorMessage, Date.now() - startTime);
      }
      
      throw error;
    }
  }

  private generateSignature(payload: any, secret: string): string {
    const timestamp = Date.now();
    const stringPayload = JSON.stringify(payload);
    const signatureData = `${timestamp}.${stringPayload}`;
    
    return crypto
      .createHmac('sha256', secret)
      .update(signatureData)
      .digest('hex');
  }

  private async logDelivery(
    deliveryId: string,
    webhookId: string,
    payloadHash: string | null,
    responseStatus: number | null,
    errorMessage: string | null,
    durationMs: number
  ): Promise<void> {
    const db = await getDB();
    await db.run(
      `INSERT INTO webhook_deliveries (id, webhook_id, payload_hash, response_status, error_message, duration_ms, delivered_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [deliveryId, webhookId, payloadHash, responseStatus, errorMessage, durationMs]
    );
  }
}