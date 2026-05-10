# Algoritmo 7 - gemini Output

O que você está descrevendo é a implementação de **Webhooks**. Essencialmente, é uma forma de o seu sistema "avisar" outro sistema que algo aconteceu, invertendo o fluxo tradicional de comunicação.

Em vez de o sistema do seu usuário ficar perguntando ao seu se há novidades (polling), o seu sistema envia os dados proativamente via HTTP POST para a URL que ele forneceu.

---

### Como funciona a arquitetura

### Passo a passo para implementação

Para criar um sistema de Webhooks robusto, você deve seguir estas etapas:

#### 1. Cadastro da URL (Payload URL)

No painel de configurações do seu site, você deve oferecer um campo onde o usuário insira a **URL de destino** e, preferencialmente, selecione quais **eventos** ele deseja monitorar (ex: `pedido.pago`, `usuario.criado`).

#### 2. Disparo do Evento (Worker)

Não dispare o Webhook dentro do fluxo principal da sua aplicação (isso deixaria seu site lento). Use uma **fila de processamento** (como Redis + Sidekiq, RabbitMQ ou BullMQ).

1. A ação é completada no banco de dados.
2. Um "Job" é enviado para a fila com os dados do evento.
3. O Worker pega esse Job e tenta fazer a requisição HTTP.

#### 3. Estrutura do Payload (O que enviar)

Envie um JSON estruturado. Um bom padrão inclui um ID único, o tipo do evento e o objeto de dados:

```json
{
  "id": "wh_12345",
  "event": "order.completed",
  "created_at": "2026-05-10T16:47:00Z",
  "data": {
    "customer_id": "cust_987",
    "amount": 150.00,
    "status": "paid"
  }
}

```

---

### Melhores Práticas e Segurança

Implementar um Webhook exige cuidado para não virar um problema de performance ou segurança:

* **Retry Policy (Tentativas):** Se o servidor do usuário estiver fora do ar (retornar erro 500 ou timeout), sua aplicação deve tentar enviar novamente após alguns minutos (backoff exponencial).
* **Segurança (Webhook Signing):** Para que o usuário saiba que foi **você** quem enviou o dado, gere uma "Assinatura" usando uma chave secreta compartilhada (HMAC-SHA256). Você envia essa assinatura no cabeçalho (Header) da requisição.
* **Timeout Curto:** Não espere mais que 5 ou 10 segundos pela resposta do servidor do usuário.

---

### Exemplo Prático (Node.js/Axios)

Se você estiver usando Node.js, o disparo simplificado seria:

```javascript
const axios = require('axios');
const crypto = require('crypto');

async function sendWebhook(userUrl, secret, payload) {
    // Gerar assinatura para segurança
    const signature = crypto.createHmac('sha256', secret)
                           .update(JSON.stringify(payload))
                           .digest('hex');

    try {
        await axios.post(userUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Hub-Signature': signature
            },
            timeout: 5000 // 5 segundos
        });
    } catch (error) {
        console.error("Falha ao enviar Webhook, agendando retry...");
        // Lógica de fila de re-tentativa aqui
    }
}

```

Qual linguagem ou framework você está utilizando no seu backend para eu te dar um exemplo mais específico?

---

# PROMPT 2

Como você não especificou a linguagem, vou fornecer uma implementação completa e profissional em **Node.js** utilizando **Express** (para a API) e **Axios** (para os disparos).

Esta estrutura já inclui o cálculo de assinatura (Hash) para garantir que o seu usuário saiba que a requisição partiu realmente do seu sistema.

### 1. O Código do Servidor (Seu Backend)

Este script faz duas coisas: simula uma ação do usuário e dispara o Webhook para a URL cadastrada.

```javascript
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Simulação de banco de dados do usuário
const userSettings = {
    webhookUrl: 'http://localhost:4000/webhook-receiver', // URL que o usuário informou
    secret: 'minha_chave_secreta_super_protegida'        // Chave para assinar o pacote
};

// Rota que simula uma ação finalizada no seu sistema
app.post('/completar-acao', async (req, res) => {
    const eventData = {
        event: 'projeto.concluido',
        timestamp: new Date().toISOString(),
        data: {
            projetoId: 123,
            status: 'sucesso'
        }
    };

    console.log('--- Ação completada! Iniciando disparo de Webhook ---');

    // 1. Gerar assinatura HMAC SHA256 para segurança
    const signature = crypto
        .createHmac('sha256', userSettings.secret)
        .update(JSON.stringify(eventData))
        .digest('hex');

    // 2. Disparar o Webhook de forma assíncrona
    try {
        await axios.post(userSettings.webhookUrl, eventData, {
            headers: {
                'Content-Type': 'application/json',
                'X-App-Signature': signature, // O usuário valida isso do lado dele
                'User-Agent': 'MeuSistemaWebhook/1.0'
            },
            timeout: 5000 // Timeout de 5 segundos
        });
        
        console.log('Webhook enviado com sucesso!');
        res.status(200).send({ message: 'Ação concluída e Webhook disparado.' });
    } catch (error) {
        console.error('Erro ao enviar Webhook:', error.message);
        res.status(500).send({ error: 'Ação concluída, mas o Webhook falhou.' });
    }
});

app.listen(3000, () => console.log('Servidor Principal rodando na porta 3000'));

```

---

### 2. O Código do Receptor (O que o seu Usuário teria)

Para você testar se está funcionando, crie este segundo script que agirá como o servidor do seu usuário recebendo os dados:

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const SECRET = 'minha_chave_secreta_super_protegida';

app.post('/webhook-receiver', (req, res) => {
    const signature = req.headers['x-app-signature'];
    const payload = JSON.stringify(req.body);

    // Validação da assinatura para garantir origem e integridade
    const expectedSignature = crypto
        .createHmac('sha256', SECRET)
        .update(payload)
        .digest('hex');

    if (signature === expectedSignature) {
        console.log('✅ Webhook legítimo recebido:', req.body);
        res.status(200).send('Recebido!');
    } else {
        console.log('❌ Assinatura inválida! Requisição ignorada.');
        res.status(401).send('Não autorizado');
    }
});

app.listen(4000, () => console.log('Receptor de Webhooks rodando na porta 4000'));

```

---

### Como Testar

1. **Instale as dependências:**
`npm install express axios`
2. **Rode o receptor** (simulando seu usuário) em um terminal:
`node receptor.js`
3. **Rode o servidor principal** em outro terminal:
`node servidor.js`
4. **Dispare a ação** via terminal ou Postman:
`curl -X POST http://localhost:3000/completar-acao`

### Considerações Importantes para Produção:

* **Filas:** No mundo real, use uma biblioteca como `BullMQ` ou `Bee-Queue`. Se a URL do usuário estiver lenta, ela não pode travar o seu servidor.
* **Retentativas:** Se o `axios.post` falhar, agende uma nova tentativa para daqui a 5, 15 e 30 minutos.
* **Logs:** Guarde um histórico dos disparos (status code e payload) para que o seu usuário possa debugar no painel dele por que um webhook falhou.