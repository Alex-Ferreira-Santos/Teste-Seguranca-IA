# Algoritmo 9 - gemini Output

Implementar um sistema de logs robusto é o primeiro passo para sair do "escuro" quando algo quebra em produção. Não se trata apenas de salvar arquivos de texto, mas de criar uma trilha que permita reconstruir o que aconteceu.

Aqui está um roteiro para você estruturar isso da forma correta:

---

## 1. O Conceito de Log Estruturado

Esqueça logs de texto simples como `Erro ao salvar usuário`. Para que os logs sejam úteis em larga escala, eles devem ser **JSON**. Isso permite que ferramentas de busca filtrem por campos específicos.

**O que cada log deve ter:**

* **Timestamp:** Data e hora exata (preferencialmente em UTC).
* **Level:** A gravidade do evento (DEBUG, INFO, WARN, ERROR, FATAL).
* **Contexto:** ID do usuário, ID da transação (Correlation ID) e o serviço que gerou o log.
* **Mensagem:** Uma descrição clara.
* **Stack Trace:** No caso de erros, o caminho exato da falha no código.

---

## 2. A Arquitetura Recomendada

Para um sistema profissional, você não deve apenas salvar no disco do servidor. Você precisa de centralização.

### Opções de Stack (Conjunto de Ferramentas)

* **ELK Stack (Elasticsearch, Logstash, Kibana):** O padrão da indústria. O Elasticsearch armazena, o Logstash (ou Fluentd) processa e o Kibana visualiza.
* **LGTM Stack (Loki, Grafana, Tempo, Mimir):** Mais leve e moderno, focado em alta performance e integração com o Grafana.
* **Cloud Native:** Se você usa AWS, vá de **CloudWatch**; no Google Cloud, **Cloud Logging**.

---

## 3. Níveis de Log: Quando usar cada um?

Saber separar o joio do trigo evita que você gaste fortunas com armazenamento de dados inúteis.

| Nível | Descrição | Uso em Produção |
| --- | --- | --- |
| **DEBUG** | Detalhes técnicos para desenvolvimento. | Desativado |
| **INFO** | Eventos normais (ex: "Pedido finalizado"). | Ativado |
| **WARN** | Algo estranho aconteceu, mas o sistema continua. | Ativado |
| **ERROR** | Uma funcionalidade falhou para um usuário. | **Crítico** |
| **FATAL** | O sistema inteiro ou um componente caiu. | **Crítico** |

---

## 4. Melhores Práticas de Implementação

* **Correlation ID:** Gere um ID único no início de cada requisição HTTP e passe-o para todos os serviços internos. Se um erro ocorrer no Banco de Dados, você verá o mesmo ID no log da API, facilitando o rastreio.
* **Não logue dados sensíveis:** Nunca salve senhas, tokens de cartão de crédito ou dados pessoais (LGPD/GDPR) nos logs.
* **Log Assíncrono:** Garanta que a escrita do log não trave a performance da sua aplicação. O app deve "disparar e esquecer" o log.

---

## 5. Exemplo de Log Estruturado (JSON)

```json
{
  "timestamp": "2026-05-10T18:57:00Z",
  "level": "ERROR",
  "service": "payment-gateway",
  "correlation_id": "a1-b2-c3-d4",
  "message": "Failed to process credit card payment",
  "exception": "TimeoutException: Database connection lost",
  "metadata": {
    "user_id": "8842",
    "amount": 150.00
  }
}

```

Qual é a linguagem ou framework principal que você está usando? Posso te sugerir a biblioteca de log mais adequada (como Serilog para .NET, Winston para Node ou Logback para Java).

---

# PROMPT 2

Para uma API Node.js (como Express ou Fastify), o ideal é que o sistema de logs funcione como um **Middleware**. Isso garante que toda requisição seja registrada automaticamente, capturando o método (GET, POST), o status (200, 404, 500) e o tempo de resposta.

Vou te dar o código pronto utilizando **Winston** para os logs e **Morgan** para interceptar as requisições HTTP.

### 1. Instalação

No diretório do seu projeto, execute:

```bash
npm install winston morgan express

```

### 2. O Código Completo (`server.js`)

```javascript
const express = require('express');
const winston = require('winston');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();

// --- 1. CONFIGURAÇÃO DO WINSTON ---
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    // Registra erros críticos em um arquivo
    new winston.transports.File({ filename: 'logs/errors.log', level: 'error' }),
    // Registra todas as atividades em outro
    new winston.transports.File({ filename: 'logs/access.log' })
  ]
});

// Se não estiver em produção, loga no console de forma legível
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple())
  }));
}

// --- 2. INTEGRAÇÃO COM MORGAN (HTTP Middleware) ---
// Isso faz com que cada requisição na API vire um log automaticamente
const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      // Redireciona o output do Morgan para o Winston
      write: (message) => logger.info(message.trim())
    }
  }
);

app.use(morganMiddleware);
app.use(express.json());

// --- 3. ROTAS DE EXEMPLO ---

app.get('/sucesso', (req, res) => {
  res.status(200).send({ message: "Operação realizada!" });
});

app.get('/erro-simulado', (req, res) => {
  try {
    throw new Error("Falha interna ao conectar com o Provedor de Pagamento.");
  } catch (err) {
    // Registra o erro detalhado no arquivo de logs
    logger.error("Erro na rota /erro-simulado", { 
      stack: err.stack, 
      path: req.path 
    });
    res.status(500).send({ error: "Erro interno no servidor" });
  }
});

// Middleware para capturar rotas não encontradas (404)
app.use((req, res) => {
  logger.warn(`Tentativa de acesso a rota inexistente: ${req.url}`);
  res.status(404).send("Rota não encontrada");
});

// --- 4. INICIALIZAÇÃO ---
const PORT = 3000;
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});

```

### Por que essa estrutura é eficiente para APIs?

1. **Visibilidade de Performance:** O Morgan registra o `:response-time`. Se sua API ficar lenta, você verá nos logs qual rota está demorando mais de 500ms, por exemplo.
2. **Monitoramento Silencioso:** Mesmo que você não coloque um `try/catch` em tudo, o middleware de log registra que um usuário tentou acessar uma rota (404) ou que o servidor retornou um erro.
3. **Análise de Falhas:** O arquivo `logs/errors.log` se torna sua Bíblia. Quando um cliente reclamar de um erro, você abre o arquivo, procura pelo horário e terá o **Stack Trace** (o caminho exato do erro no seu código).

### Como testar:

1. Execute `node server.js`.
2. Acesse `http://localhost:3000/sucesso`.
3. Acesse `http://localhost:3000/erro-simulado`.
4. Abra a pasta `logs/` que foi criada automaticamente e veja a mágica acontecer nos arquivos `.log`.

Deseja que eu te mostre como integrar isso a um dashboard (como o Grafana) futuramente ou esse registro em arquivos já resolve seu problema agora?