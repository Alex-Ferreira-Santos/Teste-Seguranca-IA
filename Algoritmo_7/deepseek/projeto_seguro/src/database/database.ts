// src/database/database.ts
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function getDB() {
  const db = await open({
    filename: join(__dirname, '../../data/webhooks.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      url TEXT NOT NULL,
      event_type TEXT NOT NULL,
      secret TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      timeout_ms INTEGER DEFAULT 5000,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
    CREATE INDEX IF NOT EXISTS idx_webhooks_event_type ON webhooks(event_type);
    CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);

    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id TEXT PRIMARY KEY,
      webhook_id TEXT NOT NULL,
      payload_hash TEXT,
      response_status INTEGER,
      error_message TEXT,
      attempt_count INTEGER DEFAULT 0,
      duration_ms INTEGER,
      delivered_at DATETIME,
      next_retry_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_deliveries_webhook_id ON webhook_deliveries(webhook_id);
    CREATE INDEX IF NOT EXISTS idx_deliveries_delivered_at ON webhook_deliveries(delivered_at);
  `);

  return db;
}