import crypto from 'crypto'
import { webhookQueue } from './webhookQueue.js'
import { db } from './db.js' // seu ORM/cliente de banco

/**
 * Salva ou atualiza a configuração de webhook de um usuário/tenant.
 */
export async function saveWebhook({ tenantId, url, event, method = 'POST', secret }) {
  validateUrl(url)

  await db.webhook.upsert({
    where: { tenantId_event: { tenantId, event } },
    update: { url, method, secret },
    create: { tenantId, url, event, method, secret },
  })
}

/**
 * Chama esta função ao final de qualquer ação do sistema.
 * Ela enfileira o disparo — não bloqueia o fluxo principal.
 *
 * Exemplo de uso:
 *   await dispatchWebhook('order.completed', { order_id: 'ord_123', total: 99.9 })
 */
export async function dispatchWebhook(event, payload) {
  const webhooks = await db.webhook.findMany({ where: { event } })

  for (const webhook of webhooks) {
    await webhookQueue.add(
      'dispatch',
      { webhook, payload },
      {
        attempts: 4,
        backoff: { type: 'exponential', delay: 30_000 }, // 30s, 1min, 2min, 4min
        removeOnComplete: false,
        removeOnFail: false,
      }
    )
  }
}

/**
 * Assina o payload com HMAC-SHA256.
 * O receptor pode verificar com o mesmo secret.
 */
export function signPayload(secret, body) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

/**
 * Rejeita URLs internas para evitar SSRF.
 */
function validateUrl(raw) {
  let parsed
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error(`URL inválida: ${raw}`)
  }

  const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1']
  const isPrivate = blocked.includes(parsed.hostname)
    || /^10\./.test(parsed.hostname)
    || /^192\.168\./.test(parsed.hostname)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(parsed.hostname)

  if (isPrivate) throw new Error('URL aponta para rede interna — não permitido.')
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Apenas HTTP/HTTPS são permitidos.')
}