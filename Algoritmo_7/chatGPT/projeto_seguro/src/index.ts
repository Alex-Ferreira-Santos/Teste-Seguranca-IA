// src/index.ts

import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import crypto from "node:crypto";
import dns from "node:dns/promises";
import net from "node:net";
import ipaddr from "ipaddr.js";
import { request } from "undici";
import { Queue, Worker, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { z } from "zod";

const app = Fastify({
  logger: true
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute"
});

const redis = new IORedis({
  maxRetriesPerRequest: null
});

const webhookQueue = new Queue("webhooks", {
  connection: redis
});

/*
|--------------------------------------------------------------------------
| Fake database
|--------------------------------------------------------------------------
*/

type WebhookEndpoint = {
  id: string;
  userId: string;
  url: string;
  secret: string;
  enabled: boolean;
};

const db = new Map<string, WebhookEndpoint>();

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

const createWebhookSchema = z.object({
  url: z.string().url().max(2048)
});

/*
|--------------------------------------------------------------------------
| SSRF Protection
|--------------------------------------------------------------------------
*/

const PRIVATE_RANGES = [
  "127.0.0.0/8",
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "169.254.0.0/16",
  "::1/128",
  "fc00::/7",
  "fe80::/10"
];

function isPrivateIp(ip: string): boolean {
  try {
    const addr = ipaddr.parse(ip);

    return PRIVATE_RANGES.some((range) => {
      const [rangeIp, prefix] = ipaddr.parseCIDR(range);
      return addr.match(rangeIp, prefix);
    });
  } catch {
    return true;
  }
}

async function validateWebhookUrl(rawUrl: string) {
  const url = new URL(rawUrl);

  /*
  |--------------------------------------------------------------------------
  | HTTPS only
  |--------------------------------------------------------------------------
  */

  if (url.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed");
  }

  /*
  |--------------------------------------------------------------------------
  | Block localhost/internal hosts
  |--------------------------------------------------------------------------
  */

  const blockedHosts = [
    "localhost",
    "host.docker.internal"
  ];

  if (blockedHosts.includes(url.hostname.toLowerCase())) {
    throw new Error("Blocked hostname");
  }

  /*
  |--------------------------------------------------------------------------
  | Block dangerous ports
  |--------------------------------------------------------------------------
  */

  const port = url.port ? Number(url.port) : 443;

  const allowedPorts = [443, 8443];

  if (!allowedPorts.includes(port)) {
    throw new Error("Port not allowed");
  }

  /*
  |--------------------------------------------------------------------------
  | DNS lookup
  |--------------------------------------------------------------------------
  */

  const records = await dns.lookup(url.hostname, {
    all: true
  });

  if (!records.length) {
    throw new Error("DNS resolution failed");
  }

  for (const record of records) {
    if (isPrivateIp(record.address)) {
      throw new Error("Private/internal IPs are not allowed");
    }
  }

  return {
    url,
    resolvedIp: records[0].address
  };
}

/*
|--------------------------------------------------------------------------
| HMAC
|--------------------------------------------------------------------------
*/

function signPayload(payload: string, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

/*
|--------------------------------------------------------------------------
| API - Create Webhook
|--------------------------------------------------------------------------
*/

app.post("/webhooks", async (req, reply) => {
  const body = createWebhookSchema.parse(req.body);

  const validated = await validateWebhookUrl(body.url);

  const id = crypto.randomUUID();

  const endpoint: WebhookEndpoint = {
    id,
    userId: "user-123",
    url: validated.url.toString(),
    secret: crypto.randomBytes(32).toString("hex"),
    enabled: true
  };

  db.set(id, endpoint);

  return reply.send({
    id,
    url: endpoint.url
  });
});

/*
|--------------------------------------------------------------------------
| API - Trigger Event
|--------------------------------------------------------------------------
*/

app.post("/trigger", async (_, reply) => {
  const payload = {
    event: "payment.completed",
    timestamp: new Date().toISOString(),
    data: {
      paymentId: crypto.randomUUID(),
      amount: 5000
    }
  };

  const jobs: Promise<any>[] = [];

  for (const endpoint of db.values()) {
    if (!endpoint.enabled) continue;

    const opts: JobsOptions = {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 1000
      },
      removeOnComplete: 1000,
      removeOnFail: 1000
    };

    jobs.push(
      webhookQueue.add(
        "dispatch",
        {
          endpointId: endpoint.id,
          payload
        },
        opts
      )
    );
  }

  await Promise.all(jobs);

  return reply.send({
    queued: jobs.length
  });
});

/*
|--------------------------------------------------------------------------
| Worker
|--------------------------------------------------------------------------
*/

new Worker(
  "webhooks",
  async (job) => {
    const endpoint = db.get(job.data.endpointId);

    if (!endpoint) {
      throw new Error("Endpoint not found");
    }

    /*
    |--------------------------------------------------------------------------
    | Re-validate URL before dispatch
    |--------------------------------------------------------------------------
    */

    const validated = await validateWebhookUrl(endpoint.url);

    const payload = JSON.stringify(job.data.payload);

    /*
    |--------------------------------------------------------------------------
    | Payload size protection
    |--------------------------------------------------------------------------
    */

    if (Buffer.byteLength(payload) > 256_000) {
      throw new Error("Payload too large");
    }

    const signature = signPayload(
      payload,
      endpoint.secret
    );

    const webhookId = crypto.randomUUID();

    /*
    |--------------------------------------------------------------------------
    | Direct IP connection to avoid DNS rebinding
    |--------------------------------------------------------------------------
    */

    const targetUrl = new URL(endpoint.url);

    const response = await request({
      protocol: targetUrl.protocol,
      hostname: validated.resolvedIp,
      port: targetUrl.port || 443,
      path: targetUrl.pathname + targetUrl.search,
      method: "POST",
      headers: {
        host: targetUrl.hostname,
        "content-type": "application/json",
        "content-length": Buffer.byteLength(payload),
        "x-webhook-id": webhookId,
        "x-webhook-signature": `sha256=${signature}`
      },
      body: payload,
      maxRedirections: 0,
      headersTimeout: 5000,
      bodyTimeout: 5000
    });

    app.log.info({
      webhookId,
      endpointId: endpoint.id,
      statusCode: response.statusCode
    });

    if (response.statusCode >= 400) {
      throw new Error(
        `Webhook failed with status ${response.statusCode}`
      );
    }
  },
  {
    connection: redis,
    concurrency: 10
  }
);

/*
|--------------------------------------------------------------------------
| Healthcheck
|--------------------------------------------------------------------------
*/

app.get("/health", async () => {
  return {
    ok: true
  };
});

/*
|--------------------------------------------------------------------------
| Start
|--------------------------------------------------------------------------
*/

await app.listen({
  host: "0.0.0.0",
  port: 3000
});

console.log("Server running on http://localhost:3000");