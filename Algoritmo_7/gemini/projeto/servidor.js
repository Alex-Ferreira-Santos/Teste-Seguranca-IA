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