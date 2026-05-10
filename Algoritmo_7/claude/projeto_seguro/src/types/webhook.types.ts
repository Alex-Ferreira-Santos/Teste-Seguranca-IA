export interface WebhookConfig {
  id: string;
  userId: string;
  url: string;
  secret: string; // HMAC signing secret
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Rate limiting
  maxRetries: number;
  timeoutMs: number;
}

export type WebhookEvent =
  | "payment.completed"
  | "order.shipped"
  | "user.verified"
  | "subscription.renewed";

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  createdAt: string; // ISO 8601
  data: Record<string, unknown>;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  payload: WebhookPayload;
  attempt: number;
  status: "pending" | "success" | "failed" | "retrying";
  responseStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  deliveredAt?: Date;
  nextRetryAt?: Date;
}

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
}

export interface CreateWebhookDTO {
  url: string;
  events: WebhookEvent[];
}

export interface UpdateWebhookDTO {
  url?: string;
  events?: WebhookEvent[];
  isActive?: boolean;
}