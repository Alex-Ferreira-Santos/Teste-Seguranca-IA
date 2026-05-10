import { Queue, Worker } from 'bullmq'
import { signPayload } from './webhookService.js'
import { db } from './db.js'

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
}

// Fila de disparos
export const webhookQueue = new Queue('webhooks', { connection })

// Worker — processa cada job da fila
export const webhookWorker = new Worker(
  'webhooks',
  async (job) => {
    const { webhook, payload } = job.data
    const { url, method, secret, id: webhookId } = webhook

    const body = JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString(),
    })

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'MyApp-Webhook/1.0',
    }

    if (secret) {
      headers['X-Webhook-Signature'] = `sha256=${signPayload(secret, body)}`
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000) // 10s timeout

    let statusCode
    let responseBody

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: method !== 'GET' ? body : undefined,
        signal: controller.signal,
      })

      statusCode = res.status
      responseBody = await res.text().catch(() => '')

      if (!res.ok) {
        throw new Error(`Servidor retornou ${res.status}: ${responseBody.slice(0, 200)}`)
      }
    } finally {
      clearTimeout(timeout)
      // Registra a tentativa independentemente de sucesso ou falha
      await logDelivery({
        webhookId,
        event: payload.event,
        url,
        statusCode,
        attempt: job.attemptsMade + 1,
        success: statusCode >= 200 && statusCode < 300,
      })
    }

    return { statusCode }
  },
  {
    connection,
    concurrency: 10, // processa até 10 disparos em paralelo
  }
)

// Eventos do worker para observabilidade
webhookWorker.on('failed', (job, err) => {
  const attemptsLeft = job.opts.attempts - job.attemptsMade
  if (attemptsLeft <= 0) {
    console.error(`[webhook] Falhou definitivamente após ${job.attemptsMade} tentativas:`, {
      url: job.data.webhook.url,
      event: job.data.payload.event,
      error: err.message,
    })
  }
})

async function logDelivery({ webhookId, event, url, statusCode, attempt, success }) {
  await db.webhookDelivery.create({
    data: { webhookId, event, url, statusCode, attempt, success, deliveredAt: new Date() },
  })
}