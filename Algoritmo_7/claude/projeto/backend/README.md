# Webhook System

Disparo de webhooks com fila, retentativas automáticas e assinatura HMAC.

## Stack

- **BullMQ** — fila de jobs com retentativas e backoff exponencial
- **Redis** — backend da fila
- **Prisma** — persistência de configurações e histórico de entregas

## Instalação

```bash
npm install bullmq ioredis
# Redis local via Docker:
docker run -d -p 6379:6379 redis:alpine
```

Variáveis de ambiente necessárias:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # opcional
```

## Setup no seu app Express

```js
import express from 'express'
import { webhookRouter } from './src/webhookRoutes.js'
import { webhookWorker } from './src/webhookQueue.js'

const app = express()
app.use(express.json())
app.use('/webhooks', webhookRouter)

// O worker inicia automaticamente ao importar webhookQueue.js
// Para encerrar com graceful shutdown:
process.on('SIGTERM', async () => {
  await webhookWorker.close()
  process.exit(0)
})
```

## Como usar no código

```js
import { dispatchWebhook } from './src/webhookService.js'

// Chame ao final de qualquer ação do sistema:
await dispatchWebhook('order.completed', {
  order_id: 'ord_8f2k1',
  total: 149.90,
  customer_id: 'cus_3xz9',
})
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/webhooks` | Salva configuração |
| GET | `/webhooks` | Lista webhooks do tenant |
| DELETE | `/webhooks/:id` | Remove webhook |
| GET | `/webhooks/:id/deliveries` | Histórico de entregas |
| POST | `/webhooks/:id/test` | Disparo de teste |

## Verificação da assinatura (lado do receptor)

```js
import crypto from 'crypto'

function verifySignature(secret, rawBody, signatureHeader) {
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))
}
```

## Fluxo de retentativas

| Tentativa | Delay |
|-----------|-------|
| 1ª | imediato |
| 2ª | 30 segundos |
| 3ª | ~1 minuto |
| 4ª | ~2 minutos |

Após 4 falhas, o job é marcado como `failed` e registrado no histórico.