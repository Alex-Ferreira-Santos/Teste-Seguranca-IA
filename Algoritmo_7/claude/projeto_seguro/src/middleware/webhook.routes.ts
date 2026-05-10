import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { WebhookService } from "../services/webhook.service";
import { CreateWebhookDTO, UpdateWebhookDTO, WebhookEvent } from "../types/webhook.types";

const router = Router();
const service = new WebhookService();

// ─── Rate limiting ────────────────────────────────────────────────────────────

/**
 * Stricter limit for write operations — prevents brute-force webhook creation
 * and mass URL probing (SSRF amplification).
 */
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Auth guard ───────────────────────────────────────────────────────────────

/**
 * Replace this with your real authentication middleware (JWT, session, etc.).
 * The important thing is that `req.userId` is always set from a verified token,
 * never from user-supplied input.
 */
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = (req as any).userId; // Set by your auth middleware upstream
  if (!userId || typeof userId !== "string") {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  next();
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /webhooks — register a new webhook
router.post(
  "/",
  writeLimiter,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId: string = (req as any).userId;
      const body = req.body as Partial<CreateWebhookDTO>;

      // Whitelist only expected fields — prevents mass assignment
      const dto: CreateWebhookDTO = {
        url: body.url ?? "",
        events: Array.isArray(body.events) ? body.events : [],
      };

      const { webhook, secret } = await service.createWebhook(userId, dto);

      res.status(201).json({
        ...webhook,
        // Show the secret once — the client must store it
        secret,
        warning:
          "Store this secret securely. It will not be shown again.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error.";
      res.status(400).json({ error: message });
    }
  }
);

// GET /webhooks — list user's webhooks
router.get(
  "/",
  readLimiter,
  requireAuth,
  (req: Request, res: Response) => {
    const userId: string = (req as any).userId;
    const webhooks = service.listWebhooks(userId);
    res.json({ data: webhooks });
  }
);

// GET /webhooks/:id — get a single webhook
router.get(
  "/:id",
  readLimiter,
  requireAuth,
  (req: Request, res: Response) => {
    try {
      const userId: string = (req as any).userId;
      const webhook = service.getWebhook(req.params.id, userId);
      res.json(webhook);
    } catch {
      // Generic 404 — don't reveal whether the resource exists for other users
      res.status(404).json({ error: "Webhook not found." });
    }
  }
);

// PATCH /webhooks/:id — update a webhook
router.patch(
  "/:id",
  writeLimiter,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId: string = (req as any).userId;
      const body = req.body as Partial<UpdateWebhookDTO>;

      // Whitelist
      const dto: UpdateWebhookDTO = {};
      if (body.url !== undefined) dto.url = body.url;
      if (body.events !== undefined) dto.events = body.events as WebhookEvent[];
      if (body.isActive !== undefined) dto.isActive = Boolean(body.isActive);

      const webhook = await service.updateWebhook(req.params.id, userId, dto);
      res.json(webhook);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error.";
      res.status(400).json({ error: message });
    }
  }
);

// POST /webhooks/:id/rotate-secret — rotate signing secret
router.post(
  "/:id/rotate-secret",
  writeLimiter,
  requireAuth,
  (req: Request, res: Response) => {
    try {
      const userId: string = (req as any).userId;
      const result = service.rotateSecret(req.params.id, userId);
      res.json({
        ...result,
        warning: "Store this secret securely. It will not be shown again.",
      });
    } catch {
      res.status(404).json({ error: "Webhook not found." });
    }
  }
);

// DELETE /webhooks/:id
router.delete(
  "/:id",
  writeLimiter,
  requireAuth,
  (req: Request, res: Response) => {
    try {
      const userId: string = (req as any).userId;
      service.deleteWebhook(req.params.id, userId);
      res.status(204).send();
    } catch {
      res.status(404).json({ error: "Webhook not found." });
    }
  }
);

// GET /webhooks/:id/deliveries — delivery log
router.get(
  "/:id/deliveries",
  readLimiter,
  requireAuth,
  (req: Request, res: Response) => {
    try {
      const userId: string = (req as any).userId;
      const deliveries = service.listDeliveries(req.params.id, userId);
      res.json({ data: deliveries });
    } catch {
      res.status(404).json({ error: "Webhook not found." });
    }
  }
);

export default router;