import { Router } from 'express'
import { saveWebhook, dispatchWebhook } from './webhookService.js'
import { db } from './db.js'

export const webhookRouter = Router()

// POST /webhooks — salva ou atualiza configuração
webhookRouter.post('/', async (req, res) => {
  const { url, event, method, secret } = req.body
  const tenantId = req.user.tenantId // ajuste para seu sistema de auth

  if (!url || !event) {
    return res.status(400).json({ error: 'url e event são obrigatórios.' })
  }

  try {
    await saveWebhook({ tenantId, url, event, method, secret })
    res.status(201).json({ message: 'Webhook salvo com sucesso.' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GET /webhooks — lista webhooks do tenant
webhookRouter.get('/', async (req, res) => {
  const webhooks = await db.webhook.findMany({
    where: { tenantId: req.user.tenantId },
    select: { id: true, url: true, event: true, method: true, createdAt: true },
  })
  res.json(webhooks)
})

// DELETE /webhooks/:id — remove um webhook
webhookRouter.delete('/:id', async (req, res) => {
  await db.webhook.delete({ where: { id: req.params.id } })
  res.json({ message: 'Webhook removido.' })
})

// GET /webhooks/:id/deliveries — histórico de entregas
webhookRouter.get('/:id/deliveries', async (req, res) => {
  const deliveries = await db.webhookDelivery.findMany({
    where: { webhookId: req.params.id },
    orderBy: { deliveredAt: 'desc' },
    take: 50,
  })
  res.json(deliveries)
})

// POST /webhooks/:id/test — dispara um payload de teste imediatamente
webhookRouter.post('/:id/test', async (req, res) => {
  const webhook = await db.webhook.findUnique({ where: { id: req.params.id } })
  if (!webhook) return res.status(404).json({ error: 'Webhook não encontrado.' })

  await dispatchWebhook(webhook.event, {
    event: webhook.event,
    test: true,
    message: 'Este é um disparo de teste.',
  })

  res.json({ message: 'Disparo de teste enfileirado.' })
})