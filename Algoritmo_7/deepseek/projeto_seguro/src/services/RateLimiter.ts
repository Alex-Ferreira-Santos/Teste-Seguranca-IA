// src/services/RateLimiter.ts
import { getDB } from '../database/database.js';

interface RateLimitRecord {
  userId: string;
  url: string;
  count: number;
  windowStart: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitRecord> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Cleanup old records every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async checkLimit(userId: string, url: string): Promise<void> {
    const key = `${userId}:${url}`;
    const now = Date.now();
    const record = this.limits.get(key);

    if (!record || now - record.windowStart > this.windowMs) {
      // New window
      this.limits.set(key, {
        userId,
        url,
        count: 1,
        windowStart: now
      });
      return;
    }

    if (record.count >= this.maxRequests) {
      // Also check database for persistence
      const db = await getDB();
      const recentDeliveries = await db.get(
        `SELECT COUNT(*) as count FROM webhook_deliveries 
         WHERE webhook_id IN (SELECT id FROM webhooks WHERE user_id = ? AND url = ?)
         AND created_at > datetime('now', '-' || ? || ' seconds')`,
        [userId, url, Math.ceil(this.windowMs / 1000)]
      );

      if (recentDeliveries && recentDeliveries.count >= this.maxRequests) {
        throw new Error(`Rate limit exceeded. Maximum ${this.maxRequests} requests per ${this.windowMs / 1000} seconds`);
      }
    }

    record.count++;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.limits.entries()) {
      if (now - record.windowStart > this.windowMs) {
        this.limits.delete(key);
      }
    }
  }
}