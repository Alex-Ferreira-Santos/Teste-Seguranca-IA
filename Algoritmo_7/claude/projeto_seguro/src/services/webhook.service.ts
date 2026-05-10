import crypto from "crypto";
import {
  WebhookConfig,
  WebhookDelivery,
  WebhookEvent,
  WebhookPayload,
  CreateWebhookDTO,
  UpdateWebhookDTO,
} from "../types/webhook.types";
import { validateWebhookUrl } from "../validators/url.validator";
import { generateWebhookSecret } from "../utils/signature";
import { WebhookDispatcher } from "./webhook.dispatcher";

// ─── In-memory store (replace with your DB repository) ───────────────────────

const webhooks = new Map<string, WebhookConfig>();
const deliveries = new Map<string, WebhookDelivery>();

const dispatcher = new WebhookDispatcher();

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_WEBHOOKS_PER_USER = 10;
const ALLOWED_EVENTS: Set<WebhookEvent> = new Set([
  "payment.completed",
  "order.shipped",
  "user.verified",
  "subscription.renewed",
]);

// ─── Service ──────────────────────────────────────────────────────────────────

export class WebhookService {
  // ── Create ─────────────────────────────────────────────────────────────────

  async createWebhook(
    userId: string,
    dto: CreateWebhookDTO
  ): Promise<{ webhook: WebhookConfig; secret: string }> {
    // Rate limit: max webhooks per user
    const existing = [...webhooks.values()].filter((w) => w.userId === userId);
    if (existing.length >= MAX_WEBHOOKS_PER_USER) {
      throw new Error(
        `Maximum of ${MAX_WEBHOOKS_PER_USER} webhooks per account allowed.`
      );
    }

    // Validate URL (async — includes DNS resolution)
    const validation = await validateWebhookUrl(dto.url);
    if (!validation.isValid) {
      throw new Error(`Invalid webhook URL: ${validation.error}`);
    }

    // Validate events
    const invalidEvents = dto.events.filter((e) => !ALLOWED_EVENTS.has(e));
    if (invalidEvents.length) {
      throw new Error(`Unknown event types: ${invalidEvents.join(", ")}`);
    }

    if (dto.events.length === 0) {
      throw new Error("At least one event must be selected.");
    }

    // Generate a new signing secret — shown only once to the user
    const secret = generateWebhookSecret();

    const webhook: WebhookConfig = {
      id: crypto.randomUUID(),
      userId,
      url: dto.url,
      secret,           // Store hashed in production! (e.g. bcrypt or store plain in HSM)
      events: [...new Set(dto.events)],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      maxRetries: 5,
      timeoutMs: 10_000,
    };

    webhooks.set(webhook.id, webhook);

    // Return the secret ONCE — the user must store it securely
    return { webhook: { ...webhook, secret: "[redacted]" }, secret };
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  getWebhook(webhookId: string, userId: string): WebhookConfig {
    const webhook = webhooks.get(webhookId);
    if (!webhook || webhook.userId !== userId) {
      throw new Error("Webhook not found.");
    }
    // Never expose the raw secret
    return { ...webhook, secret: "[redacted]" };
  }

  listWebhooks(userId: string): WebhookConfig[] {
    return [...webhooks.values()]
      .filter((w) => w.userId === userId)
      .map((w) => ({ ...w, secret: "[redacted]" }));
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  async updateWebhook(
    webhookId: string,
    userId: string,
    dto: UpdateWebhookDTO
  ): Promise<WebhookConfig> {
    const webhook = this.#getOwned(webhookId, userId);

    if (dto.url !== undefined) {
      const validation = await validateWebhookUrl(dto.url);
      if (!validation.isValid) {
        throw new Error(`Invalid webhook URL: ${validation.error}`);
      }
      webhook.url = dto.url;
    }

    if (dto.events !== undefined) {
      const invalidEvents = dto.events.filter((e) => !ALLOWED_EVENTS.has(e));
      if (invalidEvents.length) {
        throw new Error(`Unknown event types: ${invalidEvents.join(", ")}`);
      }
      webhook.events = [...new Set(dto.events)];
    }

    if (dto.isActive !== undefined) {
      webhook.isActive = dto.isActive;
    }

    webhook.updatedAt = new Date();
    webhooks.set(webhook.id, webhook);
    return { ...webhook, secret: "[redacted]" };
  }

  // ── Rotate secret ──────────────────────────────────────────────────────────

  rotateSecret(webhookId: string, userId: string): { secret: string } {
    const webhook = this.#getOwned(webhookId, userId);
    const newSecret = generateWebhookSecret();
    webhook.secret = newSecret;
    webhook.updatedAt = new Date();
    webhooks.set(webhook.id, webhook);
    return { secret: newSecret }; // Shown only once
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  deleteWebhook(webhookId: string, userId: string): void {
    this.#getOwned(webhookId, userId);
    webhooks.delete(webhookId);
  }

  // ── Trigger (called internally when an action completes) ───────────────────

  /**
   * Fires all active webhooks subscribed to `event` for a given user.
   * Should be called by your domain services (e.g. PaymentService, OrderService).
   */
  async triggerEvent(
    userId: string,
    event: WebhookEvent,
    data: Record<string, unknown>
  ): Promise<void> {
    const targets = [...webhooks.values()].filter(
      (w) => w.userId === userId && w.isActive && w.events.includes(event)
    );

    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      event,
      createdAt: new Date().toISOString(),
      data,
    };

    // Fire all matching webhooks concurrently
    await Promise.allSettled(
      targets.map((config) => this.#deliver(config, payload))
    );
  }

  // ── Private ────────────────────────────────────────────────────────────────

  #getOwned(webhookId: string, userId: string): WebhookConfig {
    const webhook = webhooks.get(webhookId);
    if (!webhook || webhook.userId !== userId) {
      // Use a generic error to avoid leaking whether the ID exists at all
      throw new Error("Webhook not found.");
    }
    return webhook;
  }

  async #deliver(
    config: WebhookConfig,
    payload: WebhookPayload,
    attempt = 1
  ): Promise<void> {
    const result = await dispatcher.dispatch(config, payload, attempt);

    const delivery: WebhookDelivery = {
      id: crypto.randomUUID(),
      webhookId: config.id,
      ...result,
    };

    deliveries.set(delivery.id, delivery);

    // Schedule retry if needed (in production use a job queue like BullMQ)
    if (delivery.status === "retrying" && delivery.nextRetryAt) {
      const delayMs = delivery.nextRetryAt.getTime() - Date.now();
      setTimeout(() => this.#deliver(config, payload, attempt + 1), delayMs);
    }
  }

  listDeliveries(webhookId: string, userId: string): WebhookDelivery[] {
    this.#getOwned(webhookId, userId);
    return [...deliveries.values()].filter((d) => d.webhookId === webhookId);
  }
}