// app.js
const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();

// Configuração do armazenamento dos arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // pasta onde os arquivos serão salvos
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // nome único
  }
});

const upload = multer({ storage: storage });

// Middleware para servir arquivos estáticos
app.use('/files', express.static(path.join(__dirname, 'uploads')));

// Endpoint para upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo enviado.');
  }
  // URL pública para acessar o arquivo
  const fileUrl = `/files/${req.file.filename}`;
  res.send(`Arquivo disponível em: <a href="${fileUrl}">${fileUrl}</a>`);
});

// Página simples para upload
app.get('/', (req, res) => {
  res.send(`
    <h2>Upload de Arquivo</h2>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="file" />
      <button type="submit">Enviar</button>
    </form>
  `);
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
