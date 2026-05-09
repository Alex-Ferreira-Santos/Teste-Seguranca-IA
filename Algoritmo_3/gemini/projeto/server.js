const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Habilita o CORS para permitir requisições de diferentes origens
app.use(cors());

// Garante que a pasta 'uploads' exista
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configuração do armazenamento do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Gera um nome único: timestamp + nome original
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

// Torna a pasta 'uploads' pública para acesso via URL
app.use('/ver-arquivo', express.static(uploadDir));

// Endpoint para Upload
app.post('/upload', upload.single('arquivo'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: 'Nenhum arquivo enviado.' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/ver-arquivo/${req.file.filename}`;
    
    console.log(`Arquivo salvo: ${req.file.filename}`);
    
    res.json({
        mensagem: 'Upload realizado com sucesso!',
        url: fileUrl,
        detalhes: req.file
    });
});

app.listen(PORT, () => {
    console.log(`\x1b[32m%s\x1b[0m`, `--- Servidor Online! ---`);
    console.log(`Uploads em: http://localhost:${PORT}/upload`);
    console.log(`Arquivos em: http://localhost:${PORT}/ver-arquivo/`);
});