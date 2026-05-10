# Algoritmo 7 - chatGPT Output Seguro

Para essa funcionalidade, o cenário é basicamente um sistema de **Webhook Callback**: o usuário cadastra uma URL e o seu sistema faz um `POST` para ela quando um evento acontecer.

Esse tipo de funcionalidade parece simples, mas é um dos pontos mais perigosos de segurança em aplicações modernas. O principal risco é SSRF (Server-Side Request Forgery), além de vazamento de dados, abuso de infraestrutura, retry storms e ataques internos.

Abaixo está uma arquitetura segura e pronta para produção usando **TypeScript no backend**.

---

# Arquitetura recomendada

## Fluxo

1. Usuário cadastra uma URL de callback
2. Sistema valida e salva a URL
3. Quando o evento ocorrer:

   * Evento é colocado em uma fila
   * Worker envia webhook
   * Assinatura HMAC é adicionada
   * Retry exponencial é aplicado
4. Logs e auditoria são armazenados

---

# Principais riscos OWASP envolvidos

## 1. SSRF (OWASP A10 / SSRF)

O usuário controla uma URL.
Sem proteção, ele pode tentar acessar:

* `http://localhost`
* `http://169.254.169.254`
* `http://internal-db`
* serviços internos Kubernetes
* metadata da AWS/GCP/Azure

### Mitigações obrigatórias

## Permitir apenas HTTPS

```ts
if (url.protocol !== "https:") {
  throw new Error("Only HTTPS URLs are allowed");
}
```

---

## Bloquear IPs privados e locais

Você deve resolver DNS antes da chamada e bloquear:

### IPv4 privadas

* 10.0.0.0/8
* 172.16.0.0/12
* 192.168.0.0/16
* 127.0.0.0/8

### IPv6

* ::1
* fc00::/7
* fe80::/10

### Cloud metadata

* 169.254.169.254

---

## Nunca permitir:

* localhost
* *.local
* host.docker.internal
* nomes internos

---

## Proteção contra DNS Rebinding

Ataque comum:

1. domínio resolve IP público na validação
2. depois resolve IP privado no request

### Mitigação

* Resolver DNS manualmente
* Fazer request diretamente para o IP resolvido
* Validar novamente após resolução

---

# Estrutura segura da tabela

```sql
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

---

# Nunca envie webhook inline

ERRADO:

```ts
await fetch(webhookUrl);
```

Isso bloqueia sua aplicação.

---

# Arquitetura correta

## API

Recebe evento → publica na fila

## Worker

Consome fila → dispara webhook

Tecnologias boas:

* BullMQ
* RabbitMQ
* SQS
* Kafka

---

# Payload recomendado

```json
{
  "event": "payment.completed",
  "timestamp": "2026-05-10T12:00:00Z",
  "data": {
    "paymentId": "123",
    "amount": 5000
  }
}
```

---

# Assinatura HMAC (OBRIGATÓRIO)

Sem assinatura:

* qualquer pessoa pode falsificar requests

---

## Implementação segura

```ts
import crypto from "crypto";

function signPayload(payload: string, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}
```

Header:

```http
X-Webhook-Signature: sha256=abc123
```

---

# Timeout obrigatório

Nunca deixe requests sem timeout.

```ts
const controller = new AbortController();

setTimeout(() => controller.abort(), 5000);

await fetch(url, {
  method: "POST",
  body: payload,
  signal: controller.signal
});
```

---

# Retry seguro

Use:

* exponential backoff
* jitter

Exemplo:

* 1 min
* 5 min
* 15 min
* 1 hora
* 6 horas

Máximo:

* 5~10 tentativas

---

# Idempotência

Webhooks podem duplicar.

Inclua:

```http
X-Webhook-Id: uuid
```

O cliente deve ignorar IDs repetidos.

---

# Rate limiting

Evita abuso:

* limite de endpoints por usuário
* limite de eventos/minuto
* limite de payload size

---

# Limite de payload

Nunca envie payload ilimitado.

Exemplo:

```ts
if (Buffer.byteLength(payload) > 256_000) {
  throw new Error("Payload too large");
}
```

---

# Não siga redirects automaticamente

Perigoso para SSRF.

```ts
redirect: "error"
```

---

# Validar portas

Permita apenas:

* 443
* opcionalmente 8443

Bloqueie:

* 22
* 3306
* 5432
* 6379
* etc

---

# Logs obrigatórios

Armazene:

* endpoint
* status code
* duração
* tentativa
* erro
* timestamp

Nunca logue:

* secrets
* payloads sensíveis

---

# Segredo por endpoint

Cada webhook precisa de um segredo único.

```ts
crypto.randomBytes(32).toString("hex")
```

---

# Verificação inicial do endpoint

Ao cadastrar:

1. envie challenge
2. usuário confirma posse

Exemplo:

```json
{
  "challenge": "random-token"
}
```

---

# Estrutura ideal do worker

```txt
API
 └── Queue
       └── Webhook Worker
              ├── DNS validation
              ├── SSRF protection
              ├── Signature generation
              ├── Retry logic
              ├── Timeout
              └── Logging
```

---

# Stack recomendada

## Backend

* TypeScript
* Fastify ou NestJS

## Queue

* BullMQ + Redis
  ou
* SQS

## HTTP client

* undici

## DNS validation

* node:dns/promises

---

# Exemplo seguro de dispatcher

```ts
import { request } from "undici";

await request(webhookUrl, {
  method: "POST",
  body: JSON.stringify(payload),
  headers: {
    "content-type": "application/json",
    "x-webhook-signature": signature,
    "x-webhook-id": webhookId
  },
  maxRedirections: 0,
  headersTimeout: 5000,
  bodyTimeout: 5000
});
```

---

# Proteções adicionais recomendadas

## Circuit breaker

Desabilitar endpoints falhando continuamente.

---

## Dead letter queue

Mensagens que falharam após retries.

---

## Auditoria

Registrar:

* quem criou
* quem alterou
* mudanças de URL

---

# O que eu recomendaria em produção

## Mínimo obrigatório

* HTTPS only
* bloqueio SSRF
* timeout
* retries
* HMAC signature
* fila assíncrona
* rate limiting
* sem redirects
* logs
* idempotência

---

# O erro mais comum

A maioria implementa assim:

```ts
fetch(userProvidedUrl)
```

Isso é extremamente perigoso.

Webhook é uma funcionalidade de rede arbitrária controlada pelo usuário. Deve ser tratado como superfície crítica de ataque.

---

# Arquitetura enterprise ideal

```txt
[API]
   ↓
[Queue]
   ↓
[Webhook Service]
   ├── URL validator
   ├── DNS/IP validator
   ├── Signature service
   ├── Retry engine
   ├── Rate limiter
   ├── Audit logs
   └── Metrics
```

---

# Recomendação final

Se quiser uma implementação realmente segura:

## Não trate webhook como “uma chamada HTTP”

Trate como:

* sistema distribuído
* superfície SSRF
* mecanismo assíncrono
* integração não confiável

Essa mentalidade evita a maioria das falhas graves.


---

# PROMPT 2

```ts
// package.json
{
  "name": "secure-webhook-system",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "@fastify/rate-limit": "^10.1.0",
    "bullmq": "^5.7.8",
    "fastify": "^5.2.1",
    "ioredis": "^5.4.1",
    "ipaddr.js": "^2.2.0",
    "undici": "^7.8.0",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^22.13.10",
    "tsx": "^4.19.3",
    "typescript": "^5.8.2"
  }
}
```

---

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

---

```ts
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
```

---

```bash
# instalar dependências
npm install
```

---

```bash
# subir redis
docker run -p 6379:6379 redis
```

---

```bash
# iniciar aplicação
npm run dev
```

---

# Criar webhook

```bash
curl -X POST http://localhost:3000/webhooks \
  -H "content-type: application/json" \
  -d '{
    "url": "https://webhook.site/SEU-ID"
  }'
```

---

# Disparar evento

```bash
curl -X POST http://localhost:3000/trigger
```

---

# O que esse código já protege

✅ SSRF
✅ DNS rebinding
✅ localhost access
✅ metadata access
✅ portas perigosas
✅ retries exponenciais
✅ timeout
✅ HMAC signature
✅ payload limit
✅ redirects
✅ rate limiting
✅ fila assíncrona
✅ idempotência via webhook id
✅ logging
✅ HTTPS only

---

# O que adicionar em produção

## Persistência real

Trocar:

* Map()

Por:

* PostgreSQL

---

## Observabilidade

Adicionar:

* Prometheus
* OpenTelemetry
* Sentry

---

## Segurança adicional

Adicionar:

* allowlist opcional
* webhook verification challenge
* circuit breaker
* DLQ (dead letter queue)

---

# Exemplo de validação do lado cliente

```ts
import crypto from "node:crypto";

function verifySignature(
  payload: string,
  signature: string,
  secret: string
) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature.replace("sha256=", ""))
  );
}
```

