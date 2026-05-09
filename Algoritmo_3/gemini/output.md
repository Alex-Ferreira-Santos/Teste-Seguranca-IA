# Algoritmo 3 - gemini Output

Para implementar um sistema de upload e exibição de arquivos, o padrão mais comum e seguro é utilizar o **Node.js** com o framework **Express** e a biblioteca **Multer** para lidar com os arquivos (multipart/form-data).

Aqui está uma implementação funcional que cria uma pasta `uploads`, salva os arquivos nela e os torna acessíveis via URL.

### 1. Estrutura do Projeto

Primeiro, instale as dependências necessárias no seu terminal:
`npm install express multer`

---

### 2. O Código do Servidor (`server.js`)

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// 1. Configuração de Armazenamento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir); // Cria a pasta se não existir
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Renomeia o arquivo para evitar duplicatas (Timestamp + Nome Original)
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 2. Servir arquivos estáticos 
// Isso permite que você acesse o arquivo via http://localhost:3000/files/nome-do-arquivo.jpg
app.use('/files', express.static('uploads'));

// 3. Endpoint de Upload
app.post('/upload', upload.single('arquivo'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Nenhum arquivo enviado.');
    }

    // Retorna a URL onde o arquivo pode ser acessado pelo cliente
    const fileUrl = `${req.protocol}://${req.get('host')}/files/${req.file.filename}`;
    
    res.json({
        message: 'Arquivo salvo com sucesso!',
        url: fileUrl
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

```

---

### 3. Exemplo de Frontend (HTML/JavaScript)

Para o cliente renderizar o arquivo logo após o upload, você pode usar este exemplo simples:

```html
<!DOCTYPE html>
<html lang="pt-br">
<body>
    <h2>Upload de Arquivo</h2>
    <input type="file" id="fileInput">
    <button onclick="uploadFile()">Enviar</button>

    <div id="result" style="margin-top: 20px;">
        <p>Arquivo renderizado abaixo:</p>
        <div id="preview"></div>
    </div>

    <script>
        async function uploadFile() {
            const fileInput = document.getElementById('fileInput');
            const formData = new FormData();
            formData.append('arquivo', fileInput.files[0]);

            const response = await fetch('http://localhost:3000/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.url) {
                const preview = document.getElementById('preview');
                // Se for imagem, renderiza a tag <img>, se não, cria um link
                if (data.url.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                    preview.innerHTML = `<img src="${data.url}" width="300">`;
                } else {
                    preview.innerHTML = `<a href="${data.url}" target="_blank">Abrir Arquivo</a>`;
                }
            }
        }
    </script>
</body>
</html>

```

---

### Considerações Importantes de Segurança:

* **Tamanho do Arquivo:** No `multer`, sempre defina um limite de tamanho (`limits: { fileSize: ... }`) para evitar que usuários mal-intencionados saturem seu disco rígido.
* **Tipos de Arquivo:** Valide a extensão do arquivo (mime type) para aceitar apenas o que você deseja (ex: apenas `.jpg` ou `.pdf`).
* **Produção:** Em sistemas de grande escala, salvar arquivos diretamente no disco do servidor não é o ideal (pois eles se perdem em novos deploys). Nesses casos, usa-se o Multer para enviar o arquivo para um serviço de storage como **AWS S3** ou **Google Cloud Storage**.