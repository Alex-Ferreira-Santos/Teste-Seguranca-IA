import https from "https";
import http from "http";
import { URL } from "url";
import dns from "dns/promises";
import crypto from "crypto";
import { WebhookConfig, WebhookDelivery, WebhookPayload } from "../types/webhook.types";
import { signPayload } from "../utils/signature";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_RESPONSE_BODY_BYTES = 4096; // Don't store huge responses
const MAX_REDIRECTS = 0;             // No redirects — prevents open-redirect abuse
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 30_000;

// Retry schedule: 1 min, 5 min, 30 min, 2 h, 5 h (exponential with cap)
const RETRY_DELAYS_SECONDS = [60, 300, 1800, 7200, 18000];

// ─── Private IP checker (re-used from validator, inlined to avoid import cycle) ─

function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, o) => (acc << 8) | parseInt(o, 10), 0) >>> 0;
}

const PRIVATE_CIDRS = [
  [ipToInt("127.0.0.0"),   0xff000000],
  [ipToInt("10.0.0.0"),    0xff000000],
  [ipToInt("172.16.0.0"),  0xfff00000],
  [ipToInt("192.168.0.0"), 0xffff0000],
  [ipToInt("169.254.0.0"), 0xffff0000],
  [ipToInt("100.64.0.0"),  0xffc00000],
].map(([n, m]) => ({ network: n >>> 0, mask: m >>> 0 }));

function isPrivateIPv4(ip: string): boolean {
  const n = ipToInt(ip);
  return PRIVATE_CIDRS.some(({ network, mask }) => (n & mask) === network);
}

// ─── SSRF-safe dispatcher ─────────────────────────────────────────────────────

interface DispatchResult {
  statusCode: number;
  body: string;
  durationMs: number;
}

/**
 * Dispatches an HTTP/S request to `url` in a SSRF-aware manner.
 *
 * Safety measures:
 * 1. Re-resolves the hostname before connecting (closes TOCTOU window opened
 *    after DNS validation at registration time).
 * 2. Connects to the resolved IP directly via `lookup` option — prevents the
 *    Node.js HTTP client from doing its own resolution, which could differ.
 * 3. Rejects private/loopback resolved addresses.
 * 4. No redirects followed.
 * 5. Response body capped at MAX_RESPONSE_BODY_BYTES.
 * 6. Hard timeout enforced.
 */
async function ssrfSafeDispatch(
  url: string,
  body: string,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<DispatchResult> {
  const parsed = new URL(url);
  const hostname = parsed.hostname;

  // Re-resolve to catch DNS rebinding
  const resolved = await dns.lookup(hostname, { all: false });
  const ip = resolved.address;

  if (isPrivateIPv4(ip)) {
    throw new Error(`SSRF: Hostname ${hostname} resolves to private address ${ip}`);
  }

  const start = Date.now();

  return new Promise((resolve, reject) => {
    const effectiveTimeout = Math.min(timeoutMs, MAX_TIMEOUT_MS);
    const port = parsed.port ? parseInt(parsed.port, 10) : 443;

    const options: https.RequestOptions = {
      method: "POST",
      hostname: ip,            // Connect to IP, not hostname (prevents rebinding)
      port,
      path: parsed.pathname + parsed.search,
      headers: {
        ...headers,
        Host: hostname,         // Still send the correct Host header for SNI/vhosts
      },
      // TLS: verify the certificate against the ORIGINAL hostname, not the IP
      checkServerIdentity: (_, cert) => {
        const err = (https as any).checkServerIdentity(hostname, cert);
        return err;
      },
      timeout: effectiveTimeout,
      // Do NOT follow redirects — set maxRedirects via agent or handle manually
    };

    const protocol = parsed.protocol === "https:" ? https : http;

    // Block plain HTTP — defence-in-depth (validator already rejects it)
    if (parsed.protocol !== "https:") {
      return reject(new Error("Only HTTPS is permitted for webhook delivery."));
    }

    const req = (protocol as typeof https).request(options, (res) => {
      // Reject redirects entirely
      if (res.statusCode! >= 300 && res.statusCode! < 400) {
        req.destroy();
        return reject(new Error(`Redirects are not followed (got ${res.statusCode})`));
      }

      let responseBody = "";
      let bytesRead = 0;

      res.on("data", (chunk: Buffer) => {
        bytesRead += chunk.length;
        if (bytesRead <= MAX_RESPONSE_BODY_BYTES) {
          responseBody += chunk.toString("utf8");
        }
      });

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode ?? 0,
          body: responseBody.slice(0, MAX_RESPONSE_BODY_BYTES),
          durationMs: Date.now() - start,
        });
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error(`Request timed out after ${effectiveTimeout}ms`));
    });

    req.on("error", (err) => reject(err));

    req.write(body);
    req.end();
  });
}

// ─── Webhook dispatcher ───────────────────────────────────────────────────────

export class WebhookDispatcher {
  /**
   * Delivers a webhook payload to the configured URL.
   * Returns a delivery record (caller is responsible for persisting it).
   */
  async dispatch(
    config: WebhookConfig,
    payload: WebhookPayload,
    attempt: number = 1
  ): Promise<Omit<WebhookDelivery, "id" | "webhookId">> {
    const bodyString = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signPayload(config.secret, payload, timestamp);
    const deliveryId = crypto.randomUUID();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(bodyString).toString(),
      "User-Agent": "YourApp-Webhook/1.0",
      "X-Webhook-ID": config.id,
      "X-Webhook-Delivery": deliveryId,
      "X-Webhook-Event": payload.event,
      "X-Webhook-Signature": signature,
      "X-Webhook-Timestamp": timestamp.toString(),
    };

    try {
      const result = await ssrfSafeDispatch(
        config.url,
        bodyString,
        headers,
        config.timeoutMs ?? DEFAULT_TIMEOUT_MS
      );

      const success = result.statusCode >= 200 && result.statusCode < 300;

      return {
        payload,
        attempt,
        status: success ? "success" : "failed",
        responseStatus: result.statusCode,
        responseBody: result.body,
        deliveredAt: success ? new Date() : undefined,
        nextRetryAt:
          !success && attempt <= config.maxRetries
            ? this.nextRetryAt(attempt)
            : undefined,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return {
        payload,
        attempt,
        status: attempt < config.maxRetries ? "retrying" : "failed",
        errorMessage: error,
        nextRetryAt:
          attempt < config.maxRetries ? this.nextRetryAt(attempt) : undefined,
      };
    }
  }

  private nextRetryAt(attempt: number): Date {
    const delaySecs =
      RETRY_DELAYS_SECONDS[Math.min(attempt - 1, RETRY_DELAYS_SECONDS.length - 1)];
    return new Date(Date.now() + delaySecs * 1000);
  }

  /**
   * Returns the retry schedule for documentation / display purposes.
   */
  static retrySchedule(): string[] {
    return RETRY_DELAYS_SECONDS.map((s) => {
      if (s < 60) return `${s}s`;
      if (s < 3600) return `${s / 60}min`;
      return `${s / 3600}h`;
    });
  }
}