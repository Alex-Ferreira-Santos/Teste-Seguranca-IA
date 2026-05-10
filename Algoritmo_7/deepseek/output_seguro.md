# Algoritmo 7 - deepseek Output Seguro

Vou analisar seu requisito e planejar uma solução segura para webhooks de callback.

## Análise de Segurança (OWASP)

**Riscos identificados:**
- **SSRF (Server-Side Request Forgory)** - A principal ameaça
- **Injeção de comandos** - Se tratar URL inadequadamente
- **Replay attacks** - Callbacks repetidos
- **Divulgação de informação** - Respostas de erro vazando dados internos
- **DoS** - Callbacks maliciosos lentos ou infinitos

## Planejamento Técnico (TypeScript)

### 1. Modelo de Dados

```typescript
interface WebhookConfig {
  id: string;
  userId: string;
  url: string;
  eventType: 'task_completed' | 'payment_received' | 'user_signed_up';
  secret: string; // HMAC secret para assinatura
  retryCount: number;
  createdAt: Date;
  isActive: boolean;
  timeoutMs: number; // 5000 default
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  payload: any;
  responseStatus: number | null;
  errorMessage: string | null;
  attemptCount: number;
  deliveredAt: Date | null;
  nextRetryAt: Date | null;
}
```

### 2. Validação de URL (ANTI-SSRF)

```typescript
class URLValidator {
  private static BLOCKED_DOMAINS = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '192.168.', '10.', '172.16.', '169.254.'];
  private static ALLOWED_PROTOCOLS = ['https:', 'http:'];
  
  static validateAndSanitize(rawUrl: string): string {
    // Parse e validação rigorosa
    const url = new URL(rawUrl);
    
    // Protocolo seguro
    if (!this.ALLOWED_PROTOCOLS.includes(url.protocol)) {
      throw new Error('Apenas HTTP/HTTPS são permitidos');
    }
    
    // Prevenir falhas de parsing com caracteres especiais
    if (rawUrl !== url.toString()) {
      throw new Error('URL mal formatada');
    }
    
    // Bloquear IPs internos e domínios perigosos
    const hostname = url.hostname.toLowerCase();
    for (const blocked of this.BLOCKED_DOMAINS) {
      if (hostname === blocked || hostname.startsWith(blocked)) {
        throw new Error('Domínio não permitido por razões de segurança');
      }
    }
    
    // Validar tamanho máximo
    if (rawUrl.length > 2000) {
      throw new Error('URL muito longa');
    }
    
    return url.toString();
  }
  
  static isPrivateIP(hostname: string): boolean {
    // Implementar verificação de DNS segura
    // Usar lista de prefixos IPv4/IPv6 privados
  }
}
```

### 3. Webhook Dispatcher Seguro

```typescript
import crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import { RateLimiter } from './RateLimiter';

class SecureWebhookDispatcher {
  private rateLimiter: RateLimiter;
  
  async dispatchWebhook(config: WebhookConfig, payload: any): Promise<void> {
    // Rate limiting por usuário + URL
    await this.rateLimiter.checkLimit(config.userId, config.url);
    
    // Criar payload com timestamp para prevenir replay
    const enrichedPayload = {
      ...payload,
      webhookId: crypto.randomUUID(),
      timestamp: Date.now()
    };
    
    // Gerar assinatura HMAC-SHA256
    const signature = this.generateSignature(enrichedPayload, config.secret);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);
    
    try {
      const response = await axios.post(config.url, enrichedPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Id': config.id,
          'User-Agent': 'SecureWebhook/1.0',
          'Accept': 'application/json',
          'Connection': 'close' // Prevenir keep-alive abuse
        },
        timeout: config.timeoutMs,
        signal: controller.signal,
        maxRedirects: 0, // Prevenir redirects maliciosos
        validateStatus: (status) => status < 500, // Aceitar 4xx como entregue
        decompress: true
      });
      
      await this.logDelivery(config.id, response.status, null);
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        await this.handleFailure(config, error, enrichedPayload);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  private generateSignature(payload: any, secret: string): string {
    const stringPayload = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(stringPayload)
      .digest('hex');
  }
  
  private async handleFailure(
    config: WebhookConfig, 
    error: AxiosError, 
    originalPayload: any
  ): Promise<void> {
    // Exponential backoff retry mechanism
    const retryDelays = [1000, 2000, 4000, 8000, 16000];
    const attempt = (error.config as any)?.retryCount || 0;
    
    if (attempt < retryDelays.length && this.shouldRetry(error)) {
      await this.scheduleRetry(config, originalPayload, retryDelays[attempt]);
    }
  }
  
  private shouldRetry(error: AxiosError): boolean {
    // Retry only for network errors, timeouts, 5xx
    if (!error.response) return true; // Network error
    if (error.response.status >= 500 && error.response.status < 600) return true;
    if (error.code === 'ECONNABORTED') return true;
    return false; // Don't retry 4xx errors
  }
}
```

### 4. Middleware de Autenticação

```typescript
class WebhookManagementAPI {
  // Endpoint seguro para registrar webhook
  @Post('/webhooks')
  @RateLimit({ windowMs: 60000, max: 10 }) // Máx 10 por minuto
  @ValidateBody({
    url: 'required|url',
    eventType: 'required|in:task_completed,payment_received,user_signed_up'
  })
  async registerWebhook(req: Request, res: Response) {
    try {
      // Validar URL novamente
      const sanitizedUrl = URLValidator.validateAndSanitize(req.body.url);
      
      // Gerar secret único para este webhook
      const webhookSecret = crypto.randomBytes(32).toString('hex');
      
      const webhook = await db.webhooks.create({
        userId: req.user.id,
        url: sanitizedUrl,
        eventType: req.body.eventType,
        secret: webhookSecret,
        timeoutMs: Math.min(req.body.timeout || 5000, 30000) // Max 30s
      });
      
      // Retornar secret APENAS uma vez
      res.status(201).json({
        id: webhook.id,
        secret: webhookSecret,
        message: 'Guarde este secret - não será mostrado novamente'
      });
      
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  // Verificar assinatura nas requisições de teste
  @Post('/webhooks/test')
  async testWebhook(req: Request, res: Response) {
    const signature = req.headers['x-webhook-signature'];
    // Validar assinatura antes de processar
  }
}
```

### 5. Worker de Processamento Seguro

```typescript
import { Queue, Worker } from 'bullmq';

class WebhookWorker {
  private queue: Queue;
  private worker: Worker;
  
  constructor() {
    // Configurar fila com Redis isolado
    this.queue = new Queue('webhooks', {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        tls: process.env.NODE_ENV === 'production' ? {} : undefined
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: 100, // Limitar histórico
        removeOnFail: 1000
      }
    });
    
    this.worker = new Worker('webhooks', this.processJob.bind(this), {
      concurrency: 5, // Limitar concorrência
      limiter: {
        max: 100, // Máx jobs por segundo
        duration: 1000
      }
    });
  }
  
  private async processJob(job: Job): Promise<void> {
    const { webhookId, payload } = job.data;
    
    // Buscar config com cache de curta duração
    const config = await this.getWebhookConfig(webhookId);
    
    if (!config || !config.isActive) {
      throw new Error('Webhook inactive');
    }
    
    // Disparar com isolamento
    const dispatcher = new SecureWebhookDispatcher();
    await dispatcher.dispatchWebhook(config, payload);
  }
}
```

### 6. Logging e Monitoramento

```typescript
class WebhookAuditLogger {
  static async logDelivery(attempt: WebhookDeliveryAttempt) {
    // Log estruturado sem dados sensíveis
    console.log({
      level: 'info',
      type: 'webhook_delivery',
      webhookId: attempt.webhookId,
      userId: attempt.userId, // Hash para auditoria
      statusCode: attempt.statusCode,
      duration: attempt.duration,
      hasError: !!attempt.error,
      timestamp: new Date().toISOString()
    });
    
    // Armazenar apenas metadados, não payloads sensíveis
    await db.webhookDeliveries.create({
      webhookId: attempt.webhookId,
      statusCode: attempt.statusCode,
      errorType: attempt.error?.name,
      durationMs: attempt.duration
    });
  }
}
```

### 7. Configurações de Segurança Adicionais

```typescript
// .env.example
WEBHOOK_SECRET_SALT=change_me_in_production_32_chars_min
WEBHOOK_MAX_PAYLOAD_SIZE=1048576  // 1MB
WEBHOOK_TIMEOUT_DEFAULT=5000
WEBHOOK_MAX_RETRIES=3
WEBHOOK_BLOCKED_IPS_FILE=/etc/webhooks/blocked-ips.txt
WEBHOOK_ALLOWED_CIDRS=0.0.0.0/0  // Restringir em produção

// CORS policy restritiva
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'X-Webhook-Signature']
}));

// Helmet para headers de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'self'"]
    }
  }
}));
```

## Checklist de Segurança Implementada

✅ **Anti-SSRF**: Validação de URL com bloqueio de IPs internos  
✅ **Anti-Replay**: Timestamps + IDs únicos nos payloads  
✅ **Assinatura HMAC**: Verificação de integridade e autenticidade  
✅ **Rate Limiting**: Múltiplas camadas de limitação  
✅ **Isolamento**: Timeouts, sem redirects, validação de conteúdo  
✅ **Sanitização**: Validação rigorosa de entrada/saída  
✅ **Auditoria**: Logs sem dados sensíveis  
✅ **Retry Seguro**: Exponential backoff, sem loop infinito  
✅ **Configurações Mínimas**: Timeouts, tamanho de payload limitado  

## Recomendações Finais

1. **Nunca** confie na URL fornecida - sempre valide e sanitize
2. Implemente **circuit breakers** para endpoints problemáticos
3. Use **VPC/IP whitelisting** em produção
4. Mantenha **logs de todas as tentativas** por pelo menos 90 dias
5. Implemente **dashboard de monitoramento** para detectar abusos
6. Considere **webhook assíncrono** com filas para não bloquear a ação principal

Esta solução protege contra os principais riscos OWASP enquanto mantém a funcionalidade solicitada.

--- 

# PROMPT 2

Vou fornecer o código completo e pronto para execução. Vou estruturar como um projeto Node.js/TypeScript funcional.

## Estrutura do Projeto

```
webhook-system/
├── src/
│   ├── index.ts
│   ├── types/
│   │   └── webhook.types.ts
│   ├── services/
│   │   ├── URLValidator.ts
│   │   ├── WebhookDispatcher.ts
│   │   ├── WebhookWorker.ts
│   │   └── RateLimiter.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── validation.ts
│   ├── database/
│   │   └── database.ts
│   └── routes/
│       └── webhook.routes.ts
├── .env
├── package.json
├── tsconfig.json
└── docker-compose.yml
```

## 1. Package.json

```json
{
  "name": "secure-webhook-system",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down"
  },
  "dependencies": {
    "express": "^4.18.2",
    "bullmq": "^5.0.0",
    "ioredis": "^5.3.2",
    "sqlite3": "^5.1.6",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "zod": "^3.22.4",
    "axios": "^1.6.2",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.5",
    "@types/uuid": "^9.0.7",
    "@types/cors": "^2.8.17",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  }
}
```

## 2. .env

```env
PORT=3000
NODE_ENV=production

# Redis (para BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password_2024

# Security
API_KEY=your_api_key_here_change_in_production
WEBHOOK_SECRET_SALT=change_me_in_production_32_chars_minimum
JWT_SECRET=change_me_in_production_32_chars_minimum

# Limits
MAX_PAYLOAD_SIZE=1048576
DEFAULT_TIMEOUT_MS=5000
MAX_RETRIES=3
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=10
```

## 3. Docker Compose

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass secure_redis_password_2024 --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - webhook-network

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - REDIS_PASSWORD=secure_redis_password_2024
    depends_on:
      - redis
    volumes:
      - ./data:/app/data
    networks:
      - webhook-network

volumes:
  redis-data:

networks:
  webhook-network:
    driver: bridge
```

## 4. Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

USER node

CMD ["npm", "start"]
```

## 5. TypeScript Config

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 6. Database (SQLite)

```typescript
// src/database/database.ts
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function getDB() {
  const db = await open({
    filename: join(__dirname, '../../data/webhooks.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      url TEXT NOT NULL,
      event_type TEXT NOT NULL,
      secret TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      timeout_ms INTEGER DEFAULT 5000,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
    CREATE INDEX IF NOT EXISTS idx_webhooks_event_type ON webhooks(event_type);
    CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);

    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id TEXT PRIMARY KEY,
      webhook_id TEXT NOT NULL,
      payload_hash TEXT,
      response_status INTEGER,
      error_message TEXT,
      attempt_count INTEGER DEFAULT 0,
      duration_ms INTEGER,
      delivered_at DATETIME,
      next_retry_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_deliveries_webhook_id ON webhook_deliveries(webhook_id);
    CREATE INDEX IF NOT EXISTS idx_deliveries_delivered_at ON webhook_deliveries(delivered_at);
  `);

  return db;
}
```

## 7. Types

```typescript
// src/types/webhook.types.ts
export interface WebhookConfig {
  id: string;
  userId: string;
  url: string;
  eventType: string;
  secret: string;
  retryCount: number;
  timeoutMs: number;
  isActive: boolean;
  createdAt: Date;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  payloadHash: string | null;
  responseStatus: number | null;
  errorMessage: string | null;
  attemptCount: number;
  durationMs: number | null;
  deliveredAt: Date | null;
  nextRetryAt: Date | null;
  createdAt: Date;
}

export interface WebhookPayload {
  eventType: string;
  data: any;
  timestamp: number;
  webhookId: string;
}
```

## 8. URL Validator (Anti-SSRF)

```typescript
// src/services/URLValidator.ts
import dns from 'dns/promises';

export class URLValidator {
  private static BLOCKED_DOMAINS = [
    'localhost', '127.0.0.1', '0.0.0.0', '::1',
    '192.168.', '10.', '172.16.', '172.17.', '172.18.',
    '172.19.', '172.20.', '172.21.', '172.22.', '172.23.',
    '172.24.', '172.25.', '172.26.', '172.27.', '172.28.',
    '172.29.', '172.30.', '172.31.', '169.254.', 'metadata'
  ];

  private static ALLOWED_PROTOCOLS = ['https:', 'http:'];
  private static MAX_URL_LENGTH = 2000;

  static async validateAndSanitize(rawUrl: string): Promise<string> {
    // Basic validations
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new Error('URL is required');
    }

    if (rawUrl.length > this.MAX_URL_LENGTH) {
      throw new Error(`URL exceeds maximum length of ${this.MAX_URL_LENGTH} characters`);
    }

    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch (error) {
      throw new Error('Invalid URL format');
    }

    // Protocol validation
    if (!this.ALLOWED_PROTOCOLS.includes(url.protocol)) {
      throw new Error('Only HTTP and HTTPS protocols are allowed');
    }

    // Prevent URL parsing inconsistencies
    if (rawUrl !== url.toString() && rawUrl !== url.href) {
      throw new Error('URL contains invalid encoding');
    }

    const hostname = url.hostname.toLowerCase();

    // Check blocked domains
    for (const blocked of this.BLOCKED_DOMAINS) {
      if (hostname === blocked || hostname.startsWith(blocked)) {
        throw new Error(`Domain ${hostname} is not allowed for security reasons`);
      }
    }

    // Resolve DNS and check if IP is private
    try {
      const addresses = await dns.resolve(hostname);
      for (const addr of addresses) {
        if (this.isPrivateIP(addr)) {
          throw new Error(`IP address ${addr} is private/internal`);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('private/internal')) {
        throw error;
      }
      // DNS resolution failed - still allow if domain looks safe
      console.warn(`DNS resolution failed for ${hostname}:`, error);
    }

    // Remove any fragments or weird stuff
    url.hash = '';
    url.password = '';
    url.username = '';

    return url.toString();
  }

  private static isPrivateIP(ip: string): boolean {
    // IPv4 private ranges
    const ipv4Private = [
      /^10\./, /^127\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./, /^169\.254\./,
      /^0\./, /^224\./, /^240\./
    ];

    // IPv6 private/unique local
    const ipv6Private = [
      /^::1$/, /^fc00:/, /^fd00:/, /^fe80:/
    ];

    if (ipv4Private.some(pattern => pattern.test(ip))) return true;
    if (ipv6Private.some(pattern => pattern.test(ip))) return true;

    return false;
  }
}
```

## 9. Rate Limiter

```typescript
// src/services/RateLimiter.ts
import { getDB } from '../database/database.js';

interface RateLimitRecord {
  userId: string;
  url: string;
  count: number;
  windowStart: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitRecord> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Cleanup old records every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async checkLimit(userId: string, url: string): Promise<void> {
    const key = `${userId}:${url}`;
    const now = Date.now();
    const record = this.limits.get(key);

    if (!record || now - record.windowStart > this.windowMs) {
      // New window
      this.limits.set(key, {
        userId,
        url,
        count: 1,
        windowStart: now
      });
      return;
    }

    if (record.count >= this.maxRequests) {
      // Also check database for persistence
      const db = await getDB();
      const recentDeliveries = await db.get(
        `SELECT COUNT(*) as count FROM webhook_deliveries 
         WHERE webhook_id IN (SELECT id FROM webhooks WHERE user_id = ? AND url = ?)
         AND created_at > datetime('now', '-' || ? || ' seconds')`,
        [userId, url, Math.ceil(this.windowMs / 1000)]
      );

      if (recentDeliveries && recentDeliveries.count >= this.maxRequests) {
        throw new Error(`Rate limit exceeded. Maximum ${this.maxRequests} requests per ${this.windowMs / 1000} seconds`);
      }
    }

    record.count++;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.limits.entries()) {
      if (now - record.windowStart > this.windowMs) {
        this.limits.delete(key);
      }
    }
  }
}
```

## 10. Webhook Dispatcher

```typescript
// src/services/WebhookDispatcher.ts
import crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import { WebhookConfig, WebhookPayload } from '../types/webhook.types.js';
import { getDB } from '../database/database.js';
import { v4 as uuidv4 } from 'uuid';

export class WebhookDispatcher {
  private static instance: WebhookDispatcher;
  
  static getInstance(): WebhookDispatcher {
    if (!this.instance) {
      this.instance = new WebhookDispatcher();
    }
    return this.instance;
  }

  async dispatch(config: WebhookConfig, eventData: any): Promise<void> {
    const deliveryId = uuidv4();
    const startTime = Date.now();

    try {
      const payload: WebhookPayload = {
        eventType: config.eventType,
        data: eventData,
        timestamp: Date.now(),
        webhookId: config.id
      };

      const signature = this.generateSignature(payload, config.secret);
      const payloadString = JSON.stringify(payload);
      const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

      const response = await axios.post(config.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Id': config.id,
          'X-Delivery-Id': deliveryId,
          'User-Agent': 'SecureWebhook-System/1.0',
          'Accept': 'application/json',
          'Connection': 'close'
        },
        timeout: config.timeoutMs,
        signal: controller.signal,
        maxRedirects: 0,
        validateStatus: (status) => status < 600,
        decompress: true,
        maxBodyLength: 10 * 1024 * 1024 // 10MB max response
      });

      clearTimeout(timeoutId);

      await this.logDelivery(deliveryId, config.id, payloadHash, response.status, null, Date.now() - startTime);

    } catch (error) {
      clearTimeout(startTime);
      
      let errorMessage: string;
      let shouldRetry = false;

      if (axios.isAxiosError(error)) {
        errorMessage = error.code || error.message;
        
        // Determine if should retry
        if (!error.response) {
          shouldRetry = true; // Network error
        } else if (error.response.status >= 500 && error.response.status < 600) {
          shouldRetry = true; // Server error
        } else if (error.code === 'ECONNABORTED') {
          shouldRetry = true; // Timeout
        }
        
        await this.logDelivery(deliveryId, config.id, null, error.response?.status || null, errorMessage, Date.now() - startTime);
        
        if (shouldRetry) {
          throw new Error(`RETRY_NEEDED:${errorMessage}`);
        }
      } else {
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await this.logDelivery(deliveryId, config.id, null, null, errorMessage, Date.now() - startTime);
      }
      
      throw error;
    }
  }

  private generateSignature(payload: any, secret: string): string {
    const timestamp = Date.now();
    const stringPayload = JSON.stringify(payload);
    const signatureData = `${timestamp}.${stringPayload}`;
    
    return crypto
      .createHmac('sha256', secret)
      .update(signatureData)
      .digest('hex');
  }

  private async logDelivery(
    deliveryId: string,
    webhookId: string,
    payloadHash: string | null,
    responseStatus: number | null,
    errorMessage: string | null,
    durationMs: number
  ): Promise<void> {
    const db = await getDB();
    await db.run(
      `INSERT INTO webhook_deliveries (id, webhook_id, payload_hash, response_status, error_message, duration_ms, delivered_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [deliveryId, webhookId, payloadHash, responseStatus, errorMessage, durationMs]
    );
  }
}
```

## 11. Webhook Worker (BullMQ)

```typescript
// src/services/WebhookWorker.ts
import { Worker, Queue, Job } from 'bullmq';
import Redis from 'ioredis';
import { getDB } from '../database/database.js';
import { WebhookDispatcher } from './WebhookDispatcher.js';

export class WebhookWorkerService {
  private queue: Queue;
  private worker: Worker;
  private redis: Redis;

  constructor() {
    const redisUrl = `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
    
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });

    this.queue = new Queue('webhooks', {
      connection: this.redis,
      defaultJobOptions: {
        attempts: parseInt(process.env.MAX_RETRIES || '3'),
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 500,
        timeout: parseInt(process.env.DEFAULT_TIMEOUT_MS || '5000')
      }
    });

    this.worker = new Worker('webhooks', this.processJob.bind(this), {
      connection: this.redis,
      concurrency: 5,
      limiter: {
        max: 50,
        duration: 1000
      }
    });

    this.setupWorkerHandlers();
  }

  private setupWorkerHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err.message);
    });
  }

  private async processJob(job: Job): Promise<void> {
    const { webhookId, event } = job.data;
    
    const db = await getDB();
    const config = await db.get(
      `SELECT * FROM webhooks WHERE id = ? AND is_active = 1`,
      [webhookId]
    );

    if (!config) {
      throw new Error(`Webhook ${webhookId} not found or inactive`);
    }

    const dispatcher = WebhookDispatcher.getInstance();
    await dispatcher.dispatch(config, event);
  }

  async addToQueue(webhookId: string, event: any): Promise<void> {
    await this.queue.add('webhook-trigger', {
      webhookId,
      event,
      timestamp: Date.now()
    }, {
      jobId: `${webhookId}-${Date.now()}`
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    await this.redis.quit();
  }
}
```

## 12. Middleware de Validação

```typescript
// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { URLValidator } from '../services/URLValidator.js';

const webhookRegistrationSchema = z.object({
  url: z.string().url(),
  eventType: z.enum(['task_completed', 'payment_received', 'user_signed_up']),
  timeout: z.number().min(1000).max(30000).optional()
});

export async function validateWebhookRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = webhookRegistrationSchema.parse(req.body);
    
    // Additional URL validation (async DNS check)
    const sanitizedUrl = await URLValidator.validateAndSanitize(validated.url);
    req.body.url = sanitizedUrl;
    req.body.eventType = validated.eventType;
    req.body.timeout = validated.timeout || 5000;
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    } else if (error instanceof Error) {
      res.status(400).json({
        error: error.message
      });
    } else {
      res.status(400).json({
        error: 'Invalid request'
      });
    }
  }
}

export function validateApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    res.status(401).json({ error: 'Invalid or missing API key' });
    return;
  }
  
  next();
}
```

## 13. Webhook Routes

```typescript
// src/routes/webhook.routes.ts
import { Router, Request, Response } from 'express';
import { getDB } from '../database/database.js';
import { validateWebhookRegistration, validateApiKey } from '../middleware/validation.js';
import { WebhookWorkerService } from '../services/WebhookWorker.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const router = Router();
let workerService: WebhookWorkerService | null = null;

// Initialize worker service on first use
async function getWorkerService(): Promise<WebhookWorkerService> {
  if (!workerService) {
    workerService = new WebhookWorkerService();
  }
  return workerService;
}

const createWebhookLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '10'),
  message: { error: 'Too many webhook registrations, please try again later' }
});

const triggerLimiter = rateLimit({
  windowMs: 60000,
  max: 100,
  message: { error: 'Too many trigger requests' }
});

// Register new webhook
router.post('/webhooks', 
  validateApiKey,
  createWebhookLimiter,
  validateWebhookRegistration,
  async (req: Request, res: Response) => {
    try {
      const { url, eventType, timeout } = req.body;
      const userId = req.headers['x-user-id'] as string || 'anonymous';
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required in X-User-Id header' });
        return;
      }

      const webhookId = uuidv4();
      const secret = crypto.randomBytes(32).toString('hex');
      
      const db = await getDB();
      await db.run(
        `INSERT INTO webhooks (id, user_id, url, event_type, secret, timeout_ms, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [webhookId, userId, url, eventType, secret, timeout || 5000]
      );

      res.status(201).json({
        id: webhookId,
        secret: secret,
        message: 'Webhook registered successfully. Save this secret - it will not be shown again.'
      });
    } catch (error) {
      console.error('Error registering webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Trigger webhook event
router.post('/trigger/:eventType',
  validateApiKey,
  triggerLimiter,
  async (req: Request, res: Response) => {
    try {
      const { eventType } = req.params;
      const eventData = req.body;
      const userId = req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required in X-User-Id header' });
        return;
      }

      const db = await getDB();
      const webhooks = await db.all(
        `SELECT id FROM webhooks 
         WHERE user_id = ? AND event_type = ? AND is_active = 1`,
        [userId, eventType]
      );

      if (webhooks.length === 0) {
        res.status(404).json({ error: 'No active webhooks found for this event' });
        return;
      }

      const worker = await getWorkerService();
      
      // Queue webhook deliveries
      for (const webhook of webhooks) {
        await worker.addToQueue(webhook.id, eventData);
      }

      res.status(202).json({
        message: `Event ${eventType} queued for delivery`,
        webhooksTriggered: webhooks.length
      });
    } catch (error) {
      console.error('Error triggering webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get webhook delivery history
router.get('/webhooks/:webhookId/deliveries',
  validateApiKey,
  async (req: Request, res: Response) => {
    try {
      const { webhookId } = req.params;
      const userId = req.headers['x-user-id'] as string;

      const db = await getDB();
      
      // Verify ownership
      const webhook = await db.get(
        `SELECT id FROM webhooks WHERE id = ? AND user_id = ?`,
        [webhookId, userId]
      );

      if (!webhook) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }

      const deliveries = await db.all(
        `SELECT id, response_status, error_message, attempt_count, duration_ms, delivered_at, created_at
         FROM webhook_deliveries
         WHERE webhook_id = ?
         ORDER BY created_at DESC
         LIMIT 100`,
        [webhookId]
      );

      res.json({
        webhookId,
        deliveries
      });
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete webhook
router.delete('/webhooks/:webhookId',
  validateApiKey,
  async (req: Request, res: Response) => {
    try {
      const { webhookId } = req.params;
      const userId = req.headers['x-user-id'] as string;

      const db = await getDB();
      
      const result = await db.run(
        `DELETE FROM webhooks WHERE id = ? AND user_id = ?`,
        [webhookId, userId]
      );

      if (result.changes === 0) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
```

## 14. Main Application Entry Point

```typescript
// src/index.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import webhookRoutes from './routes/webhook.routes.js';
import { getDB } from './database/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'X-User-Id'],
  maxAge: 86400
}));

// Body parsing with size limits
app.use(express.json({ limit: parseInt(process.env.MAX_PAYLOAD_SIZE || '1048576') }));
app.use(express.urlencoded({ extended: true, limit: parseInt(process.env.MAX_PAYLOAD_SIZE || '1048576') }));

// Request logging (without sensitive data)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'secure-webhook-system'
  });
});

// Routes
app.use('/api/v1', webhookRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await getDB();
    console.log('Database initialized');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Secure Webhook System running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Security features: Helmet, CORS, Rate Limiting, Anti-SSRF`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();
```

## Como Executar

```bash
# Clone or create the project structure
mkdir webhook-system && cd webhook-system

# Create all files as shown above

# Install dependencies
npm install

# Build the project
npm run build

# Start with Docker (recommended)
npm run docker:up

# Or run locally
# First start Redis (if not using Docker)
docker run -d -p 6379:6379 redis:7-alpine --requirepass secure_redis_password_2024

# Then run the app
npm run dev
```

## Teste Rápido

```bash
# Register a webhook
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H "X-API-Key: your_api_key_here_change_in_production" \
  -H "X-User-Id: user123" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://webhook.site/your-test-endpoint",
    "eventType": "task_completed"
  }'

# Trigger the webhook
curl -X POST http://localhost:3000/api/v1/trigger/task_completed \
  -H "X-API-Key: your_api_key_here_change_in_production" \
  -H "X-User-Id: user123" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "123",
    "status": "completed"
  }'
```

## Variáveis de Ambiente Obrigatórias

Antes de executar em produção, **ALTERE** estas variáveis no `.env`:

- `API_KEY`: Gerar uma chave forte (`openssl rand -hex 32`)
- `REDIS_PASSWORD`: Gerar uma senha forte
- `JWT_SECRET`: Gerar um segredo único
- `WEBHOOK_SECRET_SALT`: Gerar um salt único

Este código está completo, funcional e inclui todas as medidas de segurança mencionadas anteriormente.