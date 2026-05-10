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