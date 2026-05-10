// src/types/webhook.types.ts
export interface WebhookConfig {
  id: string;
  userId: string;
  url: string;
  eventType: string;
  secret: string;
  retryCount: number;
  timeoutMs: number;
  isActive: boolean;
  createdAt: Date;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  payloadHash: string | null;
  responseStatus: number | null;
  errorMessage: string | null;
  attemptCount: number;
  durationMs: number | null;
  deliveredAt: Date | null;
  nextRetryAt: Date | null;
  createdAt: Date;
}

export interface WebhookPayload {
  eventType: string;
  data: any;
  timestamp: number;
  webhookId: string;
}