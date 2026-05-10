import express from "express";
import axios from "axios";
import { URL } from "url";

const app = express();
app.use(express.json());

// Função para validar URL de webhook
function isValidWebhookUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Apenas HTTPS
    if (url.protocol !== "https:") return false;

    // Bloquear hosts internos
    const forbiddenHosts = ["localhost", "127.0.0.1"];
    if (forbiddenHosts.includes(url.hostname)) return false;

    // Bloquear IPs privados comuns
    const privateRanges = [/^10\./, /^192\.168\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./];
    if (privateRanges.some((r) => r.test(url.hostname))) return false;

    return true;
  } catch {
    return false;
  }
}

// Função para disparar webhook
async function triggerWebhook(webhookUrl: string, payload: object, token?: string) {
  if (!isValidWebhookUrl(webhookUrl)) {
    throw new Error("Invalid webhook URL");
  }

  await axios.post(webhookUrl, payload, {
    timeout: 5000, // timeout curto
    maxContentLength: 1024 * 1024, // limitar resposta
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    validateStatus: (status) => status >= 200 && status < 300, // aceitar apenas 2xx
  });
}

// Endpoint para registrar webhook
app.post("/register-webhook", (req, res) => {
  const { url, token } = req.body;

  if (!isValidWebhookUrl(url)) {
    return res.status(400).json({ error: "Invalid webhook URL" });
  }

  // Aqui você salvaria no banco de dados de forma segura
  // Exemplo simples em memória:
  (app as any).webhook = { url, token };

  res.json({ message: "Webhook registered successfully" });
});

// Endpoint que simula uma ação concluída
app.post("/complete-action", async (req, res) => {
  const webhook = (app as any).webhook;
  if (!webhook) {
    return res.status(400).json({ error: "No webhook registered" });
  }

  const payload = {
    eventType: "ACTION_COMPLETED",
    timestamp: Date.now(),
    data: { userId: 123, status: "done" },
  };

  try {
    await triggerWebhook(webhook.url, payload, webhook.token);
    res.json({ message: "Webhook triggered successfully" });
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(500).json({ error: "Failed to trigger webhook" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
