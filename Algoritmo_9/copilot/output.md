# Algoritmo 9 - copilot Output

Aqui está um exemplo de código pronto em **Python** que você pode executar para ter um sistema de logs que registra falhas em arquivo e também mostra no console:

```python
import logging

# Configuração básica do logger
logging.basicConfig(
    level=logging.DEBUG,  # Nível mínimo de log
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),   # Salva em arquivo
        logging.StreamHandler()           # Mostra no console
    ]
)

def dividir(a, b):
    try:
        return a / b
    except Exception as e:
        logging.error("Erro ao dividir %s por %s: %s", a, b, e)

if __name__ == "__main__":
    logging.info("Aplicação iniciada")
    resultado = dividir(10, 0)  # Vai gerar erro
    logging.debug("Resultado da operação: %s", resultado)
    logging.info("Aplicação finalizada")
```

### 🔎 O que esse código faz
- Cria logs com **timestamp**, nível e mensagem.  
- Registra em **arquivo (`app.log`)** e também no **console**.  
- Usa diferentes níveis de log: `INFO`, `DEBUG`, `ERROR`.  
- No exemplo, a divisão por zero gera um erro que é registrado automaticamente.

---

Você gostaria que eu mostre também um exemplo equivalente em **Java com Log4j** ou prefere que eu aprofunde em **integração com ferramentas externas** para monitoramento em produção?

---

# PROMPT 2

Aqui está um exemplo pronto em **JavaScript (Node.js)** usando a biblioteca **Winston**, que é bastante usada para sistemas de logs:

```javascript
// Instale primeiro com: npm install winston

const winston = require('winston');

// Configuração do logger
const logger = winston.createLogger({
  level: 'debug', // Nível mínimo de log
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} - ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),              // Mostra no console
    new winston.transports.File({ filename: 'app.log' }) // Salva em arquivo
  ]
});

// Função exemplo que gera erro
function dividir(a, b) {
  try {
    return a / b;
  } catch (error) {
    logger.error(`Erro ao dividir ${a} por ${b}: ${error.message}`);
  }
}

// Execução
logger.info("Aplicação iniciada");
const resultado = dividir(10, 0); // Vai gerar erro
logger.debug(`Resultado da operação: ${resultado}`);
logger.info("Aplicação finalizada");
```

### 🚀 Como usar
1. Crie um arquivo `app.js` com esse código.  
2. Instale a dependência:  
   ```bash
   npm install winston
   ```  
3. Execute:  
   ```bash
   node app.js
   ```  
4. Os logs aparecerão no **console** e também serão gravados em `app.log`.

---

Quer que eu mostre também como integrar esse logger com **monitoramento externo** ou prefere que eu detalhe **boas práticas de logs em produção**?

---

# PROMPT 3 (Pedindo api node)

Perfeito! Vou te dar um exemplo completo de uma **API Node.js com Express** já configurada com **Winston** para registrar logs de falhas e eventos. Esse código você pode copiar e executar direto:

```javascript
// Instale as dependências antes:
// npm init -y
// npm install express winston

const express = require('express');
const winston = require('winston');

const app = express();
const PORT = 3000;

// Configuração do logger com Winston
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} - ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'api.log' })
  ]
});

// Middleware para logar cada requisição
app.use((req, res, next) => {
  logger.info(`Requisição recebida: ${req.method} ${req.url}`);
  next();
});

// Rota de teste
app.get('/', (req, res) => {
  res.send('API funcionando com logs!');
});

// Rota que gera erro proposital
app.get('/erro', (req, res) => {
  try {
    throw new Error("Falha simulada na API");
  } catch (error) {
    logger.error(`Erro na rota /erro: ${error.message}`);
    res.status(500).send("Ocorreu um erro, verifique os logs.");
  }
});

// Inicialização do servidor
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});
```

### 🚀 Como executar
1. Crie um arquivo `server.js` com esse código.  
2. Instale as dependências:  
   ```bash
   npm init -y
   npm install express winston
   ```  
3. Execute:  
   ```bash
   node server.js
   ```  
4. Acesse no navegador:  
   - `http://localhost:3000/` → rota de teste  
   - `http://localhost:3000/erro` → rota que gera erro e registra no log  

Os registros vão aparecer no **console** e também no arquivo `api.log`.

---

Quer que eu te mostre como integrar essa API com **monitoramento externo** ou prefere que eu detalhe **boas práticas de logs em produção**?