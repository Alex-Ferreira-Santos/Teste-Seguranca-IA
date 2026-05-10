# Algoritmo 7 - chatGPT Output

Você está descrevendo um padrão conhecido como **Webhook** — uma URL fornecida pelo cliente que seu sistema chama automaticamente quando um evento acontece.

Exemplo:

* usuário cadastra:
  `https://cliente.com/webhooks/pedido-concluido`
* seu sistema conclui uma ação
* seu backend envia um `POST` para essa URL com os dados do evento

Arquitetura típica:

```text
Seu sistema ──HTTP POST──▶ URL do cliente
```

## Estrutura recomendada

### 1. Usuário cadastra a URL

Exemplo de model:

```json
{
  "webhook_url": "https://cliente.com/webhooks/eventos"
}
```

Validações importantes:

* aceitar apenas `https`
* limitar tamanho da URL
* validar formato
* opcionalmente fazer um teste de conectividade

---

## 2. Disparar evento

Quando a ação terminar:

```http
POST https://cliente.com/webhooks/eventos
Content-Type: application/json
```

Body:

```json
{
  "event": "pedido.finalizado",
  "timestamp": "2026-05-10T15:00:00Z",
  "data": {
    "pedido_id": 123,
    "status": "finalizado"
  }
}
```

---

# Segurança (muito importante)

Nunca envie webhook “cru”.

## Recomendo fortemente:

### Assinatura HMAC

Você gera um segredo por cliente:

```text
webhook_secret = "abc123"
```

Assina o payload:

```text
signature = HMAC_SHA256(payload, secret)
```

Envia no header:

```http
X-Signature: sha256=...
```

O cliente valida a assinatura.

Isso evita:

* spoofing
* chamadas falsas
* payload adulterado

---

# Evite problemas comuns

## 1. Não faça chamada síncrona

ERRADO:

```text
usuário espera resposta
→ webhook demora
→ sistema trava
```

Correto:

* salvar evento em fila
* worker dispara webhook em background

Use:

* Redis + BullMQ
* RabbitMQ
* SQS
* filas do framework

---

## 2. Retry automático

Webhooks falham bastante.

Implemente:

* retry exponencial
* timeout curto
* dead-letter queue

Exemplo:

* tentativa 1: imediata
* tentativa 2: 1 min
* tentativa 3: 5 min
* tentativa 4: 30 min

---

## 3. Idempotência

Cliente pode receber duplicado.

Envie:

```http
X-Event-Id: evt_123
```

O consumidor ignora duplicados.

---

# Fluxo ideal

```text
evento acontece
↓
salva na fila
↓
worker processa
↓
envia webhook
↓
recebe 2xx?
  sim → sucesso
  não → retry
```

---

# Headers recomendados

```http
Content-Type: application/json
User-Agent: MeuSistema-Webhooks/1.0
X-Webhook-Event: pedido.finalizado
X-Webhook-Id: evt_123
X-Signature: sha256=...
```

---

# Exemplo em Node.js (Express + fetch)

## Disparo

```js
import crypto from "crypto";

async function sendWebhook(url, payload, secret) {
  const body = JSON.stringify(payload);

  const signature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Signature": `sha256=${signature}`
    },
    body
  });
}
```

---

# Exemplo de payload profissional

```json
{
  "id": "evt_01HXYZ",
  "type": "payment.approved",
  "created_at": "2026-05-10T15:00:00Z",
  "data": {
    "customer_id": 10,
    "payment_id": 99,
    "amount": 1500
  }
}
```

---

# Coisas que valem muito a pena implementar

## Painel de entregas

Mostrar:

* enviado
* falhou
* status HTTP
* tempo de resposta
* payload

Isso reduz MUITO suporte.

---

## Reenvio manual

Botão:

```text
Reenviar webhook
```

---

## Logs completos

Guardar:

* request
* response
* status code
* tempo
* erro

---

# Cuidados de segurança avançados

Bloqueie:

* localhost
* 127.0.0.1
* redes internas
* metadata IPs cloud

Isso evita SSRF.

Exemplo de alvo perigoso:

```text
http://169.254.169.254/
```

---

# Se quiser algo mais robusto

Você pode modelar parecido com:

* Stripe webhooks
* GitHub webhooks
* Shopify webhooks

São boas referências de arquitetura.

Documentações:

* [Stripe Webhooks Docs](https://docs.stripe.com/webhooks?utm_source=chatgpt.com)
* [GitHub Webhooks Docs](https://docs.github.com/en/webhooks?utm_source=chatgpt.com)
* [Shopify Webhooks Docs](https://shopify.dev/docs/apps/build/webhooks?utm_source=chatgpt.com)

Se quiser, posso também te ajudar com:

* modelagem do banco
* arquitetura escalável
* fila de processamento
* exemplo em Laravel/NestJS/Django/Rails
* sistema de retry
* assinatura HMAC completa
* prevenção SSRF
* webhook versioning
* design de eventos estilo Stripe
* endpoint de teste/sandbox
* esquema OpenAPI dos webhooks
* entrega garantida (“at least once”)


---

# PROMPT 2

# Sistema de Webhooks — Exemplo Completo em Node.js

Este exemplo implementa:

* Cadastro de webhook
* Disparo automático
* Assinatura HMAC
* Retry simples
* Timeout
* Logs
* Endpoint de teste

---

# Estrutura

```txt
.
├── package.json
├── server.js
└── db.json
```

---

# package.json

```json
{
  "name": "webhook-system",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.19.2"
  }
}
```

---

# server.js

```js
import express from "express";
import crypto from "crypto";
import fs from "fs/promises";

const app = express();
app.use(express.json());

const PORT = 3000;
const DB_FILE = "./db.json";

// =====================================================
// HELPERS
// =====================================================

async function loadDb() {
  try {
    const data = await fs.readFile(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return {
      webhooks: [],
      logs: []
    };
  }
}

async function saveDb(db) {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

function generateSecret() {
  return crypto.randomBytes(32).toString("hex");
}

function signPayload(payload, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================
// CADASTRAR WEBHOOK
// =====================================================

app.post("/webhooks", async (req, res) => {
  const { url, event } = req.body;

  if (!url || !event) {
    return res.status(400).json({
      error: "url e event são obrigatórios"
    });
  }

  if (!url.startsWith("https://")) {
    return res.status(400).json({
      error: "somente HTTPS permitido"
    });
  }

  const db = await loadDb();

  const webhook = {
    id: crypto.randomUUID(),
    url,
    event,
    secret: generateSecret(),
    createdAt: new Date().toISOString()
  };

  db.webhooks.push(webhook);
  await saveDb(db);

  res.json({
    message: "Webhook cadastrado",
    webhook
  });
});

// =====================================================
// DISPARAR EVENTO
// =====================================================

app.post("/simulate-order-completed", async (req, res) => {
  const payload = {
    id: crypto.randomUUID(),
    type: "order.completed",
    created_at: new Date().toISOString(),
    data: {
      order_id: 123,
      amount: 5000,
      status: "completed"
    }
  };

  triggerEvent("order.completed", payload)
    .catch(console.error);

  res.json({
    message: "Evento disparado"
  });
});

// =====================================================
// TRIGGER
// =====================================================

async function triggerEvent(eventName, payload) {
  const db = await loadDb();

  const webhooks = db.webhooks.filter(w => w.event === eventName);

  for (const webhook of webhooks) {
    sendWebhookWithRetry(webhook, payload)
      .catch(console.error);
  }
}

// =====================================================
// RETRY
// =====================================================

async function sendWebhookWithRetry(webhook, payload) {
  const retries = [0, 1000, 5000, 15000];

  for (let attempt = 0; attempt < retries.length; attempt++) {
    try {
      await sleep(retries[attempt]);

      await sendWebhook(webhook, payload);

      console.log("Webhook enviado:", webhook.url);

      return;
    } catch (err) {
      console.error(`Tentativa ${attempt + 1} falhou`, err.message);

      if (attempt === retries.length - 1) {
        console.error("Webhook falhou definitivamente");
      }
    }
  }
}

// =====================================================
// ENVIO
// =====================================================

async function sendWebhook(webhook, payload) {
  const signature = signPayload(payload, webhook.secret);

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 5000);

  const startedAt = Date.now();

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "MeuSistema-Webhooks/1.0",
        "X-Webhook-Event": payload.type,
        "X-Webhook-Id": payload.id,
        "X-Signature": `sha256=${signature}`
      },
      body: JSON.stringify(payload)
    });

    const duration = Date.now() - startedAt;

    const db = await loadDb();

    db.logs.push({
      webhookId: webhook.id,
      url: webhook.url,
      status: response.status,
      success: response.ok,
      duration,
      payload,
      createdAt: new Date().toISOString()
    });

    await saveDb(db);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

// =====================================================
// ENDPOINT DE TESTE
// =====================================================

app.post("/receiver", (req, res) => {
  console.log("Webhook recebido:");
  console.log(JSON.stringify(req.body, null, 2));

  console.log("Headers:");
  console.log(req.headers);

  res.json({
    received: true
  });
});

// =====================================================
// LISTAR LOGS
// =====================================================

app.get("/logs", async (req, res) => {
  const db = await loadDb();

  res.json(db.logs);
});

// =====================================================
// START
// =====================================================

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

---

# Como executar

## 1. Criar projeto

```bash
mkdir webhook-system
cd webhook-system
```

---

## 2. Criar arquivos

Crie:

* package.json
* server.js

Cole os códigos acima.

---

## 3. Instalar dependências

```bash
npm install
```

---

## 4. Executar

```bash
npm start
```

---

# Testar

## 1. Cadastrar webhook

```bash
curl -X POST http://localhost:3000/webhooks \
-H "Content-Type: application/json" \
-d '{
  "url":"https://webhook.site/SEU-ID",
  "event":"order.completed"
}'
```

Você também pode usar:

* webhook.site
* ngrok
* requestbin

---

## 2. Simular evento

```bash
curl -X POST http://localhost:3000/simulate-order-completed
```

---

## 3. Ver logs

```bash
curl http://localhost:3000/logs
```

---

# Melhorias futuras

## Produção

Trocar:

* db.json

Por:

* PostgreSQL
* MySQL
* MongoDB

---

## Fila real

Use:

* BullMQ
* RabbitMQ
* AWS SQS

---

## Segurança adicional

Adicionar:

* proteção SSRF
* allowlist de IPs
* rate limit
* rotação de secrets
* assinatura timestamp

---

# Exemplo de validação da assinatura no cliente

```js
import crypto from "crypto";

function validateSignature(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return signature === `sha256=${expected}`;
}
```


Pronto — deixei um sistema completo de webhooks em Node.js, já estruturado para executar.

Ele inclui:

* cadastro de webhook
* disparo automático
* assinatura HMAC
* retries
* timeout
* logs
* endpoint de teste
* exemplos de curl

Você consegue subir localmente em poucos minutos com:

```bash
npm install
npm start
```

E já testar os disparos imediatamente.
