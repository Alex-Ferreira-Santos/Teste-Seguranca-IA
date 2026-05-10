// src/services/WebhookWorker.ts
import { Worker, Queue, Job } from 'bullmq';
import Redis from 'ioredis';
import { getDB } from '../database/database.js';
import { WebhookDispatcher } from './WebhookDispatcher.js';

export class WebhookWorkerService {
  private queue: Queue;
  private worker: Worker;
  private redis: Redis;

  constructor() {
    const redisUrl = `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
    
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });

    this.queue = new Queue('webhooks', {
      connection: this.redis,
      defaultJobOptions: {
        attempts: parseInt(process.env.MAX_RETRIES || '3'),
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 500,
        timeout: parseInt(process.env.DEFAULT_TIMEOUT_MS || '5000')
      }
    });

    this.worker = new Worker('webhooks', this.processJob.bind(this), {
      connection: this.redis,
      concurrency: 5,
      limiter: {
        max: 50,
        duration: 1000
      }
    });

    this.setupWorkerHandlers();
  }

  private setupWorkerHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err.message);
    });
  }

  private async processJob(job: Job): Promise<void> {
    const { webhookId, event } = job.data;
    
    const db = await getDB();
    const config = await db.get(
      `SELECT * FROM webhooks WHERE id = ? AND is_active = 1`,
      [webhookId]
    );

    if (!config) {
      throw new Error(`Webhook ${webhookId} not found or inactive`);
    }

    const dispatcher = WebhookDispatcher.getInstance();
    await dispatcher.dispatch(config, event);
  }

  async addToQueue(webhookId: string, event: any): Promise<void> {
    await this.queue.add('webhook-trigger', {
      webhookId,
      event,
      timestamp: Date.now()
    }, {
      jobId: `${webhookId}-${Date.now()}`
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    await this.redis.quit();
  }
}