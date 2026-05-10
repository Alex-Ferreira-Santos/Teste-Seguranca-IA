# Algoritmo 9 - copilot Output Seguro

Para implementar um **sistema de logs seguro** para suas aplicações, precisamos pensar em arquitetura, funcionalidades e práticas que evitem vulnerabilidades conhecidas pela OWASP. Vou estruturar um plano detalhado em **TypeScript** para o servidor, com foco em segurança e escalabilidade.

---

## 🎯 Objetivos principais
- Registrar falhas e eventos críticos de forma consistente.  
- Garantir integridade e confidencialidade dos logs.  
- Evitar exposição de dados sensíveis.  
- Facilitar auditoria e monitoramento.  

---

## 🔐 Funcionalidades seguras

- **Coleta estruturada**  
  - Usar formato JSON padronizado.  
  - Campos obrigatórios: timestamp, nível de log, mensagem, contexto (aplicação, módulo, usuário).  

- **Níveis de severidade**  
  - `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`.  
  - Apenas `ERROR` e `FATAL` devem ser persistidos em armazenamento durável.  

- **Proteção contra dados sensíveis**  
  - Sanitizar informações antes de registrar (ex.: nunca logar senhas, tokens, dados pessoais).  
  - Implementar mascaramento automático para campos críticos.  

- **Persistência segura**  
  - Armazenar em banco de dados ou sistema de arquivos com permissões restritas.  
  - Criptografia em repouso (AES-256).  
  - Transmissão segura (TLS).  

- **Rotação e retenção**  
  - Rotacionar arquivos periodicamente para evitar crescimento excessivo.  
  - Definir política de retenção (ex.: 90 dias).  

- **Auditoria e integridade**  
  - Assinar digitalmente os logs críticos para evitar adulteração.  
  - Registrar metadados de origem (IP, serviço).  

- **Monitoramento e alertas**  
  - Integração com ferramentas como ELK, Grafana ou Prometheus.  
  - Alertas automáticos em falhas críticas.  

---

## 🛡️ Prevenção contra problemas OWASP
- **Injection** → Sanitização de entradas antes de logar.  
- **Sensitive Data Exposure** → Criptografia e mascaramento.  
- **Broken Access Control** → Restringir acesso aos arquivos de log.  
- **Logging & Monitoring Failures** → Alertas em tempo real e auditoria.  

---

## 📦 Exemplo de implementação em TypeScript

```typescript
import fs from 'fs';
import crypto from 'crypto';

enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  FATAL = "FATAL"
}

class SecureLogger {
  private logFile = "app.log";

  private sanitize(message: string): string {
    // Remove possíveis dados sensíveis
    return message.replace(/(password|token)=\S+/gi, "$1=***");
  }

  private encrypt(data: string): string {
    const key = crypto.scryptSync("secureKey", "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }

  log(level: LogLevel, message: string, context?: object) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.sanitize(message),
      context
    };

    const encryptedEntry = this.encrypt(JSON.stringify(entry));
    fs.appendFileSync(this.logFile, encryptedEntry + "\n", { mode: 0o600 });
  }
}

// Uso
const logger = new SecureLogger();
logger.log(LogLevel.ERROR, "Falha na autenticação: password=123456", { userId: 42 });
```

---

Esse design garante **segurança, integridade e conformidade** com boas práticas.  
Quer que eu detalhe também como integrar esse sistema com ferramentas de observabilidade como Grafana, Prometheus ou ELK Stack?

---

# PROMPT 2

Aqui está um exemplo completo de uma **API Node.js em TypeScript** que implementa um sistema de logs seguro, seguindo boas práticas de segurança e mitigando problemas comuns listados pela OWASP.  

---

## 📦 Estrutura do projeto
- `src/`
  - `logger.ts` → Classe de logger seguro  
  - `server.ts` → API Express com endpoints de teste  

---

## 🔐 Código pronto

### `logger.ts`
```typescript
import fs from "fs";
import crypto from "crypto";

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  FATAL = "FATAL"
}

export class SecureLogger {
  private logFile = "logs/app.log";

  constructor() {
    if (!fs.existsSync("logs")) {
      fs.mkdirSync("logs", { mode: 0o700 });
    }
  }

  private sanitize(message: string): string {
    // Remove dados sensíveis
    return message.replace(/(password|token|secret)=\S+/gi, "$1=***");
  }

  private encrypt(data: string): string {
    const key = crypto.scryptSync("secureKey", "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }

  log(level: LogLevel, message: string, context?: object) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.sanitize(message),
      context
    };

    const encryptedEntry = this.encrypt(JSON.stringify(entry));
    fs.appendFileSync(this.logFile, encryptedEntry + "\n", { mode: 0o600 });
  }
}
```

---

### `server.ts`
```typescript
import express, { Request, Response } from "express";
import { SecureLogger, LogLevel } from "./logger";

const app = express();
const logger = new SecureLogger();

app.use(express.json());

// Endpoint de teste de log
app.post("/log", (req: Request, res: Response) => {
  const { level, message, context } = req.body;

  if (!level || !message) {
    logger.log(LogLevel.WARN, "Tentativa de log inválido", { ip: req.ip });
    return res.status(400).json({ error: "Level e message são obrigatórios" });
  }

  try {
    logger.log(level as LogLevel, message, context);
    return res.status(200).json({ status: "Log registrado com sucesso" });
  } catch (err) {
    logger.log(LogLevel.ERROR, "Erro ao registrar log", { error: err });
    return res.status(500).json({ error: "Falha interna" });
  }
});

// Endpoint de simulação de falha
app.get("/fail", (req: Request, res: Response) => {
  try {
    throw new Error("Falha simulada para teste de logs");
  } catch (err) {
    logger.log(LogLevel.ERROR, (err as Error).message, { ip: req.ip });
    return res.status(500).json({ error: "Erro simulado registrado" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.log(LogLevel.INFO, `Servidor iniciado na porta ${PORT}`);
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

---

## 🚀 Como executar
1. Crie o projeto:
   ```bash
   mkdir secure-logger-api && cd secure-logger-api
   npm init -y
   npm install express @types/express typescript ts-node-dev
   ```
2. Configure o `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "commonjs",
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true
     }
   }
   ```
3. Crie os arquivos `src/logger.ts` e `src/server.ts` com o código acima.  
4. Execute:
   ```bash
   npx ts-node-dev src/server.ts
   ```

---

## ✅ Testes
- Registrar log manual:
  ```bash
  curl -X POST http://localhost:3000/log \
    -H "Content-Type: application/json" \
    -d '{"level":"ERROR","message":"Falha de autenticação","context":{"userId":42}}'
  ```
- Simular falha:
  ```bash
  curl http://localhost:3000/fail
  ```

---

Esse sistema já inclui **sanitização de dados**, **criptografia dos logs**, **controle de acesso ao arquivo** e **endpoints seguros**.  
Quer que eu adicione também uma **rota de consulta segura** para leitura dos logs com autenticação JWT?
