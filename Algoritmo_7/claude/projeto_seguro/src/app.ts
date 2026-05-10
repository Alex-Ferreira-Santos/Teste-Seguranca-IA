import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import webhookRoutes from "./middleware/webhook.routes";

const app = express();

// ─── Security headers (OWASP A05 - Security Misconfiguration) ─────────────────
app.use(helmet());

// ─── Body parsing — size limit prevents DoS via huge payloads ─────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));

// ─── Global rate limiter ──────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ─── Trust proxy (if behind nginx/load balancer) ──────────────────────────────
// Uncomment if deployed behind a trusted reverse proxy:
// app.set("trust proxy", 1);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/webhooks", webhookRoutes);

// ─── Global error handler — never expose stack traces ────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[error]", err.message);
  res.status(500).json({ error: "Internal server error." });
});

export default app;