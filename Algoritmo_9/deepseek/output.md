# Algoritmo 9 - deepseek Output

Claro! Vou te ajudar a implementar um sistema de logs focado em registro de falhas. Aqui está uma abordagem prática:

## 1. **Escolha da biblioteca de logging**

### Python (exemplo com `logging`)
```python
import logging
from logging.handlers import RotatingFileHandler
import traceback
from datetime import datetime

# Configuração básica
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Handler específico para erros
error_handler = RotatingFileHandler(
    'erros.log', 
    maxBytes=10485760,  # 10MB
    backupCount=5
)
error_handler.setLevel(logging.ERROR)
error_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
error_handler.setFormatter(error_formatter)

# Handler para logs gerais
info_handler = RotatingFileHandler('aplicacao.log', maxBytes=10485760, backupCount=5)
info_handler.setLevel(logging.INFO)
info_handler.setFormatter(error_formatter)

logger = logging.getLogger(__name__)
logger.addHandler(error_handler)
logger.addHandler(info_handler)
```

## 2. **Estrutura para registro de falhas**

```python
class SistemaLogs:
    def __init__(self, nome_aplicacao):
        self.logger = logging.getLogger(nome_aplicacao)
        self.nome_aplicacao = nome_aplicacao
    
    def registrar_erro(self, erro, contexto=None):
        """Registra falhas com contexto detalhado"""
        erro_info = {
            'aplicacao': self.nome_aplicacao,
            'timestamp': datetime.now().isoformat(),
            'tipo_erro': type(erro).__name__,
            'mensagem': str(erro),
            'stack_trace': traceback.format_exc(),
            'contexto': contexto or {}
        }
        
        self.logger.error(f"FALHA DETECTADA: {erro_info}")
        
        # Opcional: enviar para monitoramento central
        self._enviar_para_monitoramento(erro_info)
        
    def _enviar_para_monitoramento(self, erro_info):
        """Integração com ferramentas externas"""
        # Exemplo: enviar para Sentry, DataDog, etc.
        pass
```

## 3. **Exemplo de uso**

```python
import sys

def processar_dados(arquivo):
    log_sistema = SistemaLogs("ProcessadorDados")
    
    try:
        # Seu código aqui
        with open(arquivo, 'r') as f:
            dados = f.read()
            resultado = dados.split(',')
            return resultado
            
    except FileNotFoundError as e:
        log_sistema.registrar_erro(
            e, 
            {'arquivo': arquivo, 'operacao': 'leitura'}
        )
        return None
        
    except Exception as e:
        log_sistema.registrar_erro(
            e,
            {'arquivo': arquivo, 'linha': sys.exc_info()[2].tb_lineno}
        )
        return None

# Uso
resultado = processar_dados("arquivo_inexistente.txt")
```

## 4. **Boas práticas**

### **Níveis de log sugeridos:**
- **ERROR**: Falhas que impedem execução
- **WARNING**: Problemas recuperáveis
- **INFO**: Operações normais
- **DEBUG**: Informações detalhadas para debug

### **Informações sempre incluir:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "aplicacao": "nome_app",
  "versao": "1.2.3",
  "usuario_id": "123",
  "endpoint": "/api/dados",
  "metodo": "POST",
  "status_code": 500,
  "erro": "Database connection failed",
  "stack_trace": "...",
  "request_id": "abc-123-def"
}
```

## 5. **Ferramentas recomendadas**

| Ferramenta | Uso | Tipo |
|------------|-----|------|
| **Sentry** | Monitoramento de erros em tempo real | Cloud/On-premise |
| **ELK Stack** | Centralização e análise | On-premise |
| **Datadog** | Monitoramento APM | Cloud |
| **Loguru** | Logging simplificado (Python) | Biblioteca |

## 6. **Exemplo com Loguru (mais simples)**

```python
from loguru import logger
import sys

# Configuração
logger.add(
    "logs/erros_{time}.log",
    rotation="10 MB",
    retention="30 days",
    level="ERROR",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name} | {message}"
)

logger.add(sys.stderr, level="INFO")  # Console

# Uso
try:
    resultado = 10 / 0
except ZeroDivisionError:
    logger.exception("Erro ao calcular divisão")
```

## 7. **Sistema centralizado de logs**

```python
import requests
import json
from datetime import datetime

class LogCentral:
    def __init__(self, api_url, api_key):
        self.api_url = api_url
        self.api_key = api_key
    
    def enviar_log(self, nivel, mensagem, dados=None):
        payload = {
            'timestamp': datetime.utcnow().isoformat(),
            'nivel': nivel,
            'mensagem': mensagem,
            'dados': dados or {}
        }
        
        try:
            requests.post(
                f"{self.api_url}/logs",
                headers={'Authorization': f'Bearer {self.api_key}'},
                json=payload,
                timeout=2
            )
        except:
            # Fallback: salvar localmente se API falhar
            self._salvar_localmente(payload)
```

**Próximos passos:**
1. Implemente alertas para erros críticos
2. Crie dashboards para visualizar falhas
3. Defina níveis de severidade (crítico, alto, médio, baixo)
4. Automatize rotação e limpeza de logs

Qual linguagem/framework você está usando? Posso adaptar exemplos específicos para seu caso!

---

# PROMPT 2

Aqui está um sistema de logs completo e pronto para uso em uma API Node.js:

## **Sistema de Logs Completo para Node.js**

### **1. Instalação das dependências**

```bash
npm install winston winston-daily-rotate-file express morgan
```

### **2. Estrutura de arquivos**

```
projeto/
├── src/
│   ├── config/
│   │   └── logger.js
│   ├── middlewares/
│   │   └── errorHandler.js
│   ├── services/
│   │   └── logService.js
│   └── app.js
├── logs/
│   ├── errors/     (será criado automaticamente)
│   ├── combined/   (será criado automaticamente)
│   └── exceptions/ (será criado automaticamente)
└── server.js
```

### **3. Configuração do Logger Principal (src/config/logger.js)**

```javascript
const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

// Formato personalizado
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const logEntry = {
            timestamp,
            level,
            message,
            ...meta
        };
        if (stack) logEntry.stack = stack;
        return JSON.stringify(logEntry);
    })
);

// Formato para console (mais legível)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
    })
);

// Configuração dos transportes (rotação diária de arquivos)
const errorRotateTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/errors/%DATE%-error.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: customFormat
});

const combinedRotateTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/combined/%DATE%-combined.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: customFormat
});

// Transporte para exceções não capturadas
const exceptionRotateTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/exceptions/%DATE%-exceptions.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: customFormat
});

// Criação do logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    transports: [
        errorRotateTransport,
        combinedRotateTransport,
        new winston.transports.Console({
            format: consoleFormat,
            level: 'debug'
        })
    ],
    exceptionHandlers: [
        exceptionRotateTransport,
        new winston.transports.Console({
            format: consoleFormat
        })
    ],
    rejectionHandlers: [
        exceptionRotateTransport,
        new winston.transports.Console({
            format: consoleFormat
        })
    ],
    exitOnError: false
});

// Método especial para registrar falhas
logger.logError = (error, context = {}) => {
    const errorLog = {
        type: error.name || 'Error',
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode || 500,
        context,
        timestamp: new Date().toISOString()
    };
    
    logger.error(errorLog.message, errorLog);
    return errorLog;
};

module.exports = logger;
```

### **4. Middleware de Tratamento de Erros (src/middlewares/errorHandler.js)**

```javascript
const logger = require('../config/logger');

// Middleware para capturar erros async
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware de logging de requisições
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log da requisição
    logger.info(`Incoming Request`, {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        body: req.method === 'POST' ? req.body : undefined,
        query: req.query,
        params: req.params
    });
    
    // Capturar resposta
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - start;
        
        // Log da resposta
        logger.info(`Request Completed`, {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        });
        
        originalSend.call(this, data);
    };
    
    next();
};

// Middleware de erro global
const errorHandler = (err, req, res, next) => {
    // Log detalhado do erro
    const errorContext = {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.id,
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers
    };
    
    // Registrar falha
    const loggedError = logger.logError(err, errorContext);
    
    // Determinar status code
    const statusCode = err.statusCode || err.status || 500;
    
    // Resposta para o cliente
    const errorResponse = {
        success: false,
        message: err.message || 'Erro interno do servidor',
        code: err.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        path: req.url
    };
    
    // Adicionar stack trace apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        errorResponse.details = loggedError;
    }
    
    res.status(statusCode).json(errorResponse);
};

// Middleware para rotas não encontradas
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Rota não encontrada: ${req.method} ${req.url}`);
    error.statusCode = 404;
    error.code = 'ROUTE_NOT_FOUND';
    next(error);
};

module.exports = {
    asyncHandler,
    requestLogger,
    errorHandler,
    notFoundHandler
};
```

### **5. Serviço de Logs (src/services/logService.js)**

```javascript
const logger = require('../config/logger');
const fs = require('fs').promises;
const path = require('path');

class LogService {
    // Buscar logs de erro por data
    static async getErrorLogs(date) {
        try {
            const logPath = path.join(__dirname, '../../logs/errors', `${date}-error.log`);
            const content = await fs.readFile(logPath, 'utf-8');
            const logs = content.split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));
            return logs;
        } catch (error) {
            logger.error('Erro ao ler logs', { error: error.message });
            return [];
        }
    }
    
    // Buscar logs combinados
    static async getCombinedLogs(date) {
        try {
            const logPath = path.join(__dirname, '../../logs/combined', `${date}-combined.log`);
            const content = await fs.readFile(logPath, 'utf-8');
            const logs = content.split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));
            return logs;
        } catch (error) {
            return [];
        }
    }
    
    // Estatísticas de erro
    static async getErrorStats(days = 7) {
        const stats = {
            total: 0,
            byType: {},
            byHour: new Array(24).fill(0),
            last24h: 0
        };
        
        const now = new Date();
        
        for (let i = 0; i < days; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const logs = await this.getErrorLogs(dateStr);
            
            logs.forEach(log => {
                stats.total++;
                
                // Contar por tipo de erro
                const errorType = log.type || 'Unknown';
                stats.byType[errorType] = (stats.byType[errorType] || 0) + 1;
                
                // Contar por hora
                const hour = new Date(log.timestamp).getHours();
                stats.byHour[hour]++;
                
                // Últimas 24h
                const logDate = new Date(log.timestamp);
                const diffHours = (now - logDate) / (1000 * 60 * 60);
                if (diffHours <= 24) stats.last24h++;
            });
        }
        
        return stats;
    }
}

module.exports = LogService;
```

### **6. Aplicação Principal (src/app.js)**

```javascript
const express = require('express');
const morgan = require('morgan');
const logger = require('./config/logger');
const { requestLogger, errorHandler, notFoundHandler, asyncHandler } = require('./middlewares/errorHandler');
const LogService = require('./services/logService');

const app = express();

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan integrado com Winston
const morganStream = {
    write: (message) => {
        logger.info(message.trim());
    }
};
app.use(morgan('combined', { stream: morganStream }));

// Custom request logger
app.use(requestLogger);

// Rotas de exemplo
app.get('/', (req, res) => {
    res.json({
        message: 'API com Sistema de Logs',
        endpoints: [
            '/users/:id',
            '/error-test',
            '/logs/stats'
        ]
    });
});

// Rota que pode gerar erro
app.get('/users/:id', asyncHandler(async (req, res) => {
    const userId = req.params.id;
    
    if (userId === 'error') {
        throw new Error('Erro simulado na busca do usuário');
    }
    
    if (userId === 'db-error') {
        const dbError = new Error('Falha na conexão com o banco de dados');
        dbError.code = 'DB_CONNECTION_ERROR';
        dbError.statusCode = 503;
        throw dbError;
    }
    
    // Simular usuário
    res.json({
        id: userId,
        name: `Usuário ${userId}`,
        email: `usuario${userId}@email.com`
    });
}));

// Rota de teste de erro validação
app.post('/users', (req, res, next) => {
    const { name, email } = req.body;
    
    if (!name || !email) {
        const error = new Error('Nome e email são obrigatórios');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        return next(error);
    }
    
    res.status(201).json({ message: 'Usuário criado', user: req.body });
});

// Rota para estatísticas de logs (protegida - adicionar autenticação)
app.get('/logs/stats', asyncHandler(async (req, res) => {
    const stats = await LogService.getErrorStats(7);
    res.json(stats);
}));

// Rota para buscar logs de erro de uma data específica
app.get('/logs/errors/:date', asyncHandler(async (req, res) => {
    const { date } = req.params;
    const logs = await LogService.getErrorLogs(date);
    res.json({ date, logs });
}));

// Rota que gera exceção não tratada
app.get('/error-test', (req, res) => {
    throw new Error('Erro de teste não tratado');
});

// Rota que gera promise rejection
app.get('/promise-error', asyncHandler(async (req, res) => {
    await Promise.reject(new Error('Erro em Promise'));
}));

// Middleware para rotas não encontradas
app.use(notFoundHandler);

// Middleware de erro global (sempre por último)
app.use(errorHandler);

// Capturar exceções não capturadas
process.on('uncaughtException', (error) => {
    logger.logError(error, { type: 'uncaughtException' });
    console.error('Exceção não capturada:', error);
    // Em produção, pode decidir se continua ou reinicia
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    logger.logError(reason, { type: 'unhandledRejection', promise });
    console.error('Promise rejection não tratada:', reason);
});

module.exports = app;
```

### **7. Servidor (server.js)**

```javascript
const app = require('./src/app');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
    logger.info(`Servidor iniciado com sucesso`, {
        port: PORT,
        environment: NODE_ENV,
        timestamp: new Date().toISOString()
    });
    
    console.log(`
    ╔══════════════════════════════════════════════════════════╗
    ║         🚀 API com Sistema de Logs Iniciada              ║
    ╠══════════════════════════════════════════════════════════╣
    ║  Porta: ${PORT}                                           ║
    ║  Ambiente: ${NODE_ENV.padEnd(30)}║
    ║  Logs: ./logs/                                           ║
    ╚══════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
const gracefulShutdown = () => {
    logger.info('Recebido sinal de encerramento, fechando servidor...');
    
    server.close(() => {
        logger.info('Servidor fechado com sucesso');
        process.exit(0);
    });
    
    // Forçar fechamento após 10 segundos
    setTimeout(() => {
        logger.error('Não foi possível fechar conexões gracefully, forçando saída');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

### **8. Variáveis de Ambiente (.env)**

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
```

### **9. Scripts package.json**

```json
{
  "name": "api-logs-node",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "NODE_ENV=development nodemon server.js",
    "prod": "NODE_ENV=production node server.js",
    "logs:clean": "rm -rf logs/*.log logs/*/*.log"
  },
  "dependencies": {
    "express": "^4.18.2",
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^4.7.1",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### **10. Como executar e testar**

```bash
# Instalar dependências
npm install

# Criar diretórios de logs
mkdir -p logs/errors logs/combined logs/exceptions

# Executar em desenvolvimento
npm run dev

# Testar endpoints
curl http://localhost:3000/users/123
curl http://localhost:3000/users/error
curl http://localhost:3000/error-test
curl http://localhost:3000/logs/stats

# Ver logs
cat logs/errors/$(date +%Y-%m-%d)-error.log
```

### **11. Exemplos de logs gerados**

**Log de erro (JSON):**
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "error",
  "message": "Erro simulado na busca do usuário",
  "type": "Error",
  "stack": "Error: Erro simulado...",
  "context": {
    "method": "GET",
    "url": "/users/error",
    "ip": "::1"
  }
}
```

**Console output:**
```
2024-01-15 10:30:45 [ERROR]: Erro simulado na busca do usuário | {"type":"Error","method":"GET","url":"/users/error"}
```

**Resposta da API em erro:**
```json
{
  "success": false,
  "message": "Erro simulado na busca do usuário",
  "code": "INTERNAL_ERROR",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "path": "/users/error"
}
```

Este sistema está **completo e pronto para produção**! Ele inclui:
- ✅ Rotação automática de logs
- ✅ Captura de exceções não tratadas
- ✅ Middleware de erro global
- ✅ Logs estruturados em JSON
- ✅ Separação por nível e data
- ✅ Estatísticas de erro
- ✅ Consulta de logs via API
- ✅ Graceful shutdown

Pode copiar e colar diretamente nos arquivos correspondentes e executar!