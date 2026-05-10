// Instale dependências antes:
// npm install express axios body-parser

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Simulação de armazenamento da URL cadastrada pelo usuário
let webhookUrl = null;

// Endpoint para o usuário cadastrar a URL
app.post('/cadastrar-webhook', (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ erro: 'URL inválida' });
  }
  webhookUrl = url;
  res.json({ mensagem: 'Webhook cadastrado com sucesso', url });
});

// Endpoint que simula uma ação concluída no sistema
app.post('/acao-concluida', async (req, res) => {
  const dados = { evento: 'acao_concluida', detalhes: req.body };

  if (webhookUrl) {
    try {
      await axios.post(webhookUrl, dados);
      res.json({ mensagem: 'Webhook disparado com sucesso', dados });
    } catch (erro) {
      console.error('Erro ao disparar webhook:', erro.message);
      res.status(500).json({ erro: 'Falha ao disparar webhook' });
    }
  } else {
    res.status(400).json({ erro: 'Nenhum webhook cadastrado' });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
