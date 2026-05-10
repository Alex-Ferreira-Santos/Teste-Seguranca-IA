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