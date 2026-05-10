import crypto from "crypto";
import { WebhookPayload } from "../types/webhook.types";

const SIGNATURE_VERSION = "v1";
const TIMESTAMP_TOLERANCE_SECONDS = 300; // 5 minutes

/**
 * Generates a cryptographically secure random secret for a webhook.
 * 32 bytes → 64-char hex string.
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Signs a webhook payload using HMAC-SHA256.
 *
 * The signed string is:  `{version}.{timestamp}.{body}`
 * This prevents replay attacks (timestamp) and version confusion attacks.
 *
 * @returns The `X-Webhook-Signature` header value.
 */
export function signPayload(
  secret: string,
  payload: WebhookPayload,
  timestamp: number = Math.floor(Date.now() / 1000)
): string {
  const body = JSON.stringify(payload);
  const signedString = `${SIGNATURE_VERSION}.${timestamp}.${body}`;

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(signedString, "utf8")
    .digest("hex");

  return `${SIGNATURE_VERSION}=${hmac},t=${timestamp}`;
}

/**
 * Verifies an incoming webhook signature on the receiver side.
 * Uses a constant-time comparison to prevent timing attacks.
 */
export function verifySignature(
  secret: string,
  rawBody: string,
  signatureHeader: string
): { valid: boolean; reason?: string } {
  // Parse header: "v1=<hex>,t=<timestamp>"
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.split("=") as [string, string])
  );

  const timestamp = parseInt(parts["t"] ?? "0", 10);
  const receivedSig = parts[SIGNATURE_VERSION];

  if (!timestamp || !receivedSig) {
    return { valid: false, reason: "Malformed signature header." };
  }

  // Reject stale payloads (replay attack mitigation)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > TIMESTAMP_TOLERANCE_SECONDS) {
    return { valid: false, reason: "Signature timestamp is outside tolerance window." };
  }

  const signedString = `${SIGNATURE_VERSION}.${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedString, "utf8")
    .digest("hex");

  // Constant-time comparison — prevents timing side-channels
  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(receivedSig, "hex");

  if (expectedBuf.length !== receivedBuf.length) {
    return { valid: false, reason: "Signature length mismatch." };
  }

  if (!crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
    return { valid: false, reason: "Signature mismatch." };
  }

  return { valid: true };
}