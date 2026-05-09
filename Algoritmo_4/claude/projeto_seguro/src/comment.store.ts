import crypto from 'crypto';

export interface Comment {
  id: string;
  author_name: string;
  author_email: string;
  body: string;
  page_id: string;
  approved: boolean;
  created_at: Date;
  ip_hash: string;
}

export type PublicComment = Omit<Comment, 'author_email' | 'ip_hash'>;

/* In-memory store — substitua por Prisma/Drizzle + PostgreSQL em produção */
const store: Comment[] = [];

const HASH_SALT = process.env.IP_HASH_SALT ?? 'troque-este-salt-em-producao';

export function hashIp(ip: string): string {
  return crypto.createHmac('sha256', HASH_SALT).update(ip).digest('hex').slice(0, 16);
}

export function insertComment(data: Omit<Comment, 'id' | 'created_at'>): Comment {
  const comment: Comment = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date(),
  };
  store.push(comment);
  return comment;
}

export function findApproved(pageId: string): PublicComment[] {
  return store
    .filter(c => c.page_id === pageId && c.approved)
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    .map(({ author_email, ip_hash, ...rest }) => rest);
}

/* Aprova um comentário pelo id (use em uma rota de admin) */
export function approveComment(id: string): boolean {
  const c = store.find(c => c.id === id);
  if (!c) return false;
  c.approved = true;
  return true;
}

/* Retorna todos os comentários pendentes (rota de admin) */
export function findPending(): PublicComment[] {
  return store
    .filter(c => !c.approved)
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    .map(({ author_email, ip_hash, ...rest }) => rest);
}
