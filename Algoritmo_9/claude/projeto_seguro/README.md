# 🔐 Secure Logging System — TypeScript

Sistema de logs estruturado, seguro e pronto para produção.

## Estrutura

```
src/
  logger/
    index.ts        ← ponto de entrada público (factory + singleton)
    logger.ts       ← implementação core
    sanitizer.ts    ← remove campos sensíveis
    middleware.ts   ← middleware Express (request/error logger)
    types.ts        ← tipos e enums
  example.ts        ← exemplo de uso com Express
tests/
  logger.test.ts    ← testes unitários (Vitest)
```

## Instalação

```bash
npm install
```

## Uso rápido

```typescript
import { createLogger, requestLogger, errorLogger } from "./src/logger/index.js";

const logger = createLogger({ service: "meu-servico" });

// Log simples
logger.info("Usuário logado", { userId: "u123" });
logger.error("Falha ao processar pagamento", err, { orderId: "o456" });

// Com Express
app.use(requestLogger(logger));
app.use(errorLogger(logger)); // após as rotas
```

## Variáveis de ambiente

| Variável              | Padrão  | Descrição                            |
|-----------------------|---------|--------------------------------------|
| `LOG_LEVEL`           | `INFO`  | DEBUG / INFO / WARN / ERROR / FATAL  |
| `LOG_FILE`            | `""`    | Caminho do arquivo (vazio = sem file) |
| `LOG_MAX_FILE_SIZE_MB`| `50`    | Tamanho máximo antes de rotacionar   |
| `LOG_MAX_FILES`       | `10`    | Número de arquivos rotacionados      |
| `LOG_CONSOLE`         | `true`  | Habilitar saída no console           |
| `LOG_RATE_LIMIT`      | `500`   | Logs/segundo por nível               |

## Segurança (OWASP)

### ✅ A09 — Security Logging & Monitoring Failures
- Todos os eventos relevantes são logados (requests, erros, falhas de autenticação).
- Formato JSON estruturado facilita ingestão por SIEM (Splunk, Elastic, Datadog).
- `correlationId` permite rastrear um fluxo entre múltiplos serviços.

### ✅ A03 — Injection
- Mensagens passam por sanitização de newlines (previne **log injection**).
- Objetos aninhados são percorridos com limite de profundidade.

### ✅ A02 — Cryptographic Failures / Dados Sensíveis
- `sanitizer.ts` reduz automaticamente campos como `password`, `token`, `apiKey`, `cpf`, etc. para `[REDACTED]`.
- Stack traces só aparecem em `NODE_ENV !== "production"`.
- IPs são mascarados no último octeto (LGPD).

### ✅ A05 — Security Misconfiguration
- `req.path` é logado (sem query string), evitando vazar parâmetros sensíveis na URL.
- Rate limiting evita que um burst de erros encha o disco (DoS via log flooding).

### ✅ A01 — Broken Access Control
- Arquivos de log devem ter permissão `640` (owner + grupo apenas).
- Recomenda-se enviar logs para um serviço centralizado (ex: CloudWatch, Loki) com acesso restrito.

## Testes

```bash
npm test
```

## Recomendações para produção

1. **Centralize os logs**: use Loki + Grafana, Elastic Stack ou AWS CloudWatch.
2. **Alertas**: configure alertas para `ERROR` e `FATAL` no seu SIEM.
3. **Retenção**: defina política de retenção (ex: 90 dias) conforme LGPD/regulação.
4. **Rate limiting distribuído**: substitua o rate limiter in-memory por Redis para ambientes com múltiplas instâncias.
5. **Assine/encripte logs críticos** se armazenados em disco por longa duração.