# Algoritmo 9 - chatGPT Output

Um bom sistema de logs precisa resolver 4 coisas ao mesmo tempo:

1. **Registrar falhas**
2. **Permitir rastrear problemas rapidamente**
3. **Centralizar logs de várias aplicações**
4. **Gerar alertas e métricas**

A arquitetura depende muito do stack que você usa, mas existe um padrão moderno que funciona bem para quase qualquer ambiente.

---

# Arquitetura recomendada

## Aplicações → Coletor → Armazenamento → Visualização/Alertas

Fluxo típico:

```text
Aplicação
   ↓
Logger estruturado
   ↓
Collector/Agent
   ↓
Elastic / Loki / CloudWatch / Datadog
   ↓
Dashboard + Alertas
```

---

# O que registrar nos logs

## Logs importantes

### INFO

Eventos normais:

```json
{
  "level": "info",
  "service": "payment-api",
  "message": "Pagamento criado",
  "userId": 123,
  "requestId": "abc-123"
}
```

---

### ERROR

Falhas:

```json
{
  "level": "error",
  "service": "payment-api",
  "message": "Erro ao processar pagamento",
  "error": "Timeout gateway",
  "stack": "...",
  "requestId": "abc-123"
}
```

---

### WARN

Situações suspeitas:

* lentidão
* retry
* uso alto de memória
* fallback acionado

---

# Recomendação importante: logs estruturados

Evite:

```text
Erro ao salvar usuário
```

Prefira JSON estruturado:

```json
{
  "level": "error",
  "message": "Erro ao salvar usuário",
  "userId": 99,
  "service": "user-api",
  "traceId": "xyz"
}
```

Isso permite:

* filtros
* buscas rápidas
* dashboards
* correlação entre serviços

---

# Stack moderna recomendada

## Opção 1 — Open Source (mais comum)

### Backend

* Grafana
* Loki
* Prometheus

### Vantagens

* custo baixo
* excelente integração
* dashboards fortes
* funciona em Kubernetes/Docker/VM

---

## Opção 2 — ELK Stack

* Elasticsearch
* Logstash
* Kibana

Muito usado em empresas grandes.

Excelente busca textual.

Mais pesado operacionalmente.

---

## Opção 3 — SaaS (mais simples)

* Datadog
* New Relic
* Sentry

Ideal se quiser rapidez de implantação.

---

# Minha recomendação prática hoje

## Pequeno/médio porte

### Stack excelente:

* Logs → Loki
* Métricas → Prometheus
* Dashboards → Grafana
* Erros → Sentry

---

# O que implementar nas aplicações

## 1. Correlation ID / Request ID

Cada requisição deve possuir um ID único.

Assim você consegue rastrear toda a execução.

Exemplo:

```text
requestId=abc123
```

---

## 2. Middleware global de erro

Toda exceção deve:

* ser logada
* registrar stacktrace
* incluir contexto
* retornar erro padronizado

---

## 3. Logs centralizados

Nunca deixar logs apenas em arquivo local.

Evite depender disso:

```text
/var/log/app.log
```

Centralize tudo.

---

## 4. Níveis de log

Use corretamente:

| Nível | Uso                    |
| ----- | ---------------------- |
| DEBUG | desenvolvimento        |
| INFO  | fluxo normal           |
| WARN  | comportamento suspeito |
| ERROR | falha operacional      |
| FATAL | aplicação caiu         |

---

# Exemplo Node.js (Winston)

## Logger

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = logger;
```

---

## Uso

```javascript
logger.error({
  message: 'Erro ao salvar usuário',
  userId: 123,
  stack: err.stack
});
```

---

# Exemplo Java Spring Boot

## application.yml

```yaml
logging:
  level:
    root: INFO
```

## Uso

```java
log.error("Erro ao processar pedido {}", pedidoId, ex);
```

---

# Alertas importantes

Você deve receber alerta quando:

* aplicação cair
* taxa de erro subir
* tempo de resposta aumentar
* fila travar
* banco ficar indisponível

---

# Observabilidade completa

Logs sozinhos ajudam muito, mas o ideal é:

| Tipo     | Ferramenta       |
| -------- | ---------------- |
| Logs     | Loki / ELK       |
| Métricas | Prometheus       |
| Tracing  | OpenTelemetry    |
| Alertas  | Grafana Alerting |

---

# Estrutura madura recomendada

```text
[Aplicações]
     ↓
[OpenTelemetry]
     ↓
[Promtail / Fluent Bit]
     ↓
[Loki]
     ↓
[Grafana]
     ↓
[Alertas]
```

---

# O maior erro comum

Muita gente registra apenas:

```text
"Erro inesperado"
```

Sem:

* stacktrace
* requestId
* usuário
* endpoint
* payload
* contexto

Depois fica impossível investigar.

---

# Recomendação final

Se fosse montar hoje do zero:

## Melhor custo-benefício

* Grafana
* Loki
* Prometheus
* OpenTelemetry
* Sentry

## Se quiser simplicidade extrema

* Datadog
* Sentry

---

Se quiser, posso também te ajudar com:

* arquitetura completa de observabilidade
* implementação em Kubernetes
* exemplo Docker Compose
* padrão de logs JSON
* tracing distribuído
* dashboards Grafana
* estratégia de retenção de logs
* logs para microserviços
* integração com OpenTelemetry
* pipeline Loki + Promtail
* exemplos para Java, Node, Python ou .NET

---

# PROMPT 2

# Sistema de Logs Completo — Node.js + Loki + Grafana

Este projeto cria um sistema completo de logs com:

* API Node.js
* Logs estruturados JSON
* Grafana
* Loki
* Promtail
* Visualização centralizada
* Registro automático de erros

---

# Estrutura do projeto

```text
logs-system/
├── app/
│   ├── package.json
│   ├── server.js
│   └── logger.js
│
├── promtail/
│   └── config.yml
│
├── loki/
│   └── config.yml
│
└── docker-compose.yml
```

---

# 1. Criar pasta do projeto

```bash
mkdir logs-system
cd logs-system
```

---

# 2. Criar estrutura

```bash
mkdir -p app
mkdir -p promtail
mkdir -p loki
```

---

# 3. docker-compose.yml

Crie o arquivo:

```yaml
version: '3.9'

services:

  app:
    build: ./app
    container_name: app
    ports:
      - "3000:3000"
    volumes:
      - ./logs:/logs
    depends_on:
      - loki

  loki:
    image: grafana/loki:2.9.0
    container_name: loki
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - ./loki/config.yml:/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:2.9.0
    container_name: promtail
    volumes:
      - ./logs:/logs
      - ./promtail/config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
    depends_on:
      - loki
```

---

# 4. app/package.json

```json
{
  "name": "logs-app",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "winston": "^3.11.0",
    "uuid": "^9.0.1"
  }
}
```

---

# 5. app/logger.js

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: '/logs/application.log'
    }),
    new winston.transports.Console()
  ]
});

module.exports = logger;
```

---

# 6. app/server.js

```javascript
const express = require('express');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

// Middleware de request ID
app.use((req, res, next) => {
  req.requestId = uuidv4();
  next();
});

// Log de requisições
app.use((req, res, next) => {
  logger.info({
    level: 'info',
    message: 'Nova requisição',
    method: req.method,
    url: req.url,
    requestId: req.requestId
  });

  next();
});

app.get('/', (req, res) => {
  logger.info({
    message: 'Endpoint principal acessado',
    requestId: req.requestId
  });

  res.json({
    success: true,
    requestId: req.requestId
  });
});

// Simula erro
app.get('/erro', (req, res) => {
  try {
    throw new Error('Erro proposital para teste');
  } catch (err) {

    logger.error({
      level: 'error',
      message: err.message,
      stack: err.stack,
      requestId: req.requestId,
      route: '/erro'
    });

    res.status(500).json({
      error: true,
      message: err.message,
      requestId: req.requestId
    });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  logger.info({
    message: `Servidor iniciado na porta ${PORT}`
  });

  console.log(`Servidor rodando na porta ${PORT}`);
});
```

---

# 7. app/Dockerfile

```dockerfile
FROM node:20

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

---

# 8. promtail/config.yml

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: application_logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: app_logs
          __path__: /logs/*.log
```

---

# 9. loki/config.yml

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

common:
  path_prefix: /tmp/loki
  storage:
    filesystem:
      chunks_directory: /tmp/loki/chunks
      rules_directory: /tmp/loki/rules
  replication_factor: 1
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://localhost:9093
```

---

# 10. Subir o ambiente

Execute:

```bash
docker compose up --build
```

---

# 11. Testar a API

## Endpoint normal

```bash
curl http://localhost:3000
```

---

## Endpoint com erro

```bash
curl http://localhost:3000/erro
```

---

# 12. Acessar Grafana

Abra:

```text
http://localhost:3001
```

Login:

```text
usuário: admin
senha: admin
```

---

# 13. Configurar Loki no Grafana

## Vá em:

```text
Connections → Data Sources → Add data source
```

Escolha:

```text
Loki
```

URL:

```text
http://loki:3100
```

Clique em:

```text
Save & Test
```

---

# 14. Visualizar logs

Vá em:

```text
Explore
```

Use a query:

```text
{job="app_logs"}
```

---

# 15. Exemplo de log registrado

```json
{
  "level": "error",
  "message": "Erro proposital para teste",
  "stack": "Error: Erro proposital para teste...",
  "requestId": "4f9b-123-abc",
  "route": "/erro",
  "timestamp": "2026-05-10T15:20:00.000Z"
}
```

---

# Funcionalidades implementadas

## Já incluído

* Logs estruturados JSON
* Request ID
* Captura de erros
* Centralização de logs
* Grafana
* Loki
* Promtail
* Docker Compose
* Rastreamento de falhas

---

# Próximos passos recomendados

## Produção

Adicionar:

* OpenTelemetry
* Prometheus
* Alertas Grafana
* Retenção de logs
* Elasticsearch
* Sentry
* Kubernetes
* Fluent Bit

---

# Comandos úteis

## Ver logs do Docker

```bash
docker compose logs -f
```

---

## Reiniciar ambiente

```bash
docker compose down

docker compose up --build
```

---

# Resultado final

Você terá:

* API registrando logs
* Erros centralizados
* Dashboard visual
* Busca por falhas
* Rastreamento por requestId
* Ambiente pronto para produção

Criei um projeto completo pronto para executar com:

* Node.js
* Winston
* Grafana
* Loki
* Promtail
* Docker Compose
* logs estruturados
* captura de erros
* requestId
* centralização de logs

Você só precisa copiar os arquivos e executar:

```bash
docker compose up --build
```

Depois acessar:

```text
http://localhost:3001
```

Login:

```text
admin / admin
```

E visualizar os logs no Grafana.
