import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('comments.db');

// Promisify db.run e db.get
export const run = promisify(db.run.bind(db));
export const get = promisify(db.get.bind(db));
export const all = promisify(db.all.bind(db));

export async function initDatabase() {
  // Criar tabela de comentários com índices e constraints
  await run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT,
      is_approved BOOLEAN DEFAULT 0,
      status TEXT DEFAULT 'pending'
    )
  `);

  // Índices para performance
  await run(`CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status)`);
  
  // Criar tabela para tokens CSRF
  await run(`
    CREATE TABLE IF NOT EXISTS csrf_tokens (
      token TEXT PRIMARY KEY,
      user_ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    )
  `);
}