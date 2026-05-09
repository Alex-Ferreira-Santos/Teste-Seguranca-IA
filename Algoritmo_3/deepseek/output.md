# Algoritmo 3 - deepseek Output

Aqui está uma implementação completa para upload e exibição de arquivos usando Node.js com Express:

## Backend (server.js)

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    // Cria diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gera nome único para evitar conflitos
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de tipos de arquivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|txt|mp4|mp3/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
  fileFilter: fileFilter
});

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Endpoint para upload de arquivos
app.post('/upload', upload.single('arquivo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Arquivo enviado com sucesso!',
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
  }
});

// Endpoint para listar todos os arquivos
app.get('/arquivos', (req, res) => {
  const uploadDir = './uploads';
  
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao ler diretório' });
    }
    
    const arquivos = files.map(file => ({
      nome: file,
      url: `/uploads/${file}`,
      extensao: path.extname(file),
      dataModificacao: fs.statSync(path.join(uploadDir, file)).mtime
    }));
    
    res.json(arquivos);
  });
});

// Endpoint para deletar arquivo
app.delete('/arquivos/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join('./uploads', filename);
  
  fs.unlink(filepath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar arquivo' });
    }
    res.json({ success: true, message: 'Arquivo deletado com sucesso' });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

## Frontend (public/index.html)

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upload e Visualização de Arquivos</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }

        .upload-area {
            border: 2px dashed #667eea;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            margin-bottom: 30px;
            transition: all 0.3s ease;
        }

        .upload-area.drag-over {
            border-color: #764ba2;
            background: #f0f0ff;
        }

        .upload-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        }

        .upload-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }

        #fileInput {
            display: none;
        }

        .progress-bar {
            width: 100%;
            height: 30px;
            background: #f0f0f0;
            border-radius: 15px;
            overflow: hidden;
            margin: 20px 0;
            display: none;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            width: 0%;
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
        }

        .message {
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            display: none;
        }

        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            display: block;
        }

        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            display: block;
        }

        .files-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .file-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            transition: transform 0.3s ease;
        }

        .file-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .file-preview {
            width: 100%;
            height: 150px;
            object-fit: cover;
            border-radius: 5px;
            margin-bottom: 10px;
        }

        .file-name {
            font-size: 12px;
            color: #666;
            margin: 10px 0;
            word-break: break-all;
        }

        .delete-btn {
            background: #dc3545;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        }

        .delete-btn:hover {
            background: #c82333;
        }

        .refresh-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📁 Sistema de Upload de Arquivos</h1>
        
        <div class="upload-area" id="uploadArea">
            <p>📂 Arraste e solte arquivos aqui ou clique para selecionar</p>
            <input type="file" id="fileInput">
            <button class="upload-btn" onclick="document.getElementById('fileInput').click()">
                Selecionar Arquivo
            </button>
        </div>

        <div class="progress-bar" id="progressBar">
            <div class="progress-fill" id="progressFill">0%</div>
        </div>

        <div id="message"></div>

        <button class="refresh-btn" onclick="carregarArquivos()">
            🔄 Atualizar Lista
        </button>

        <h2>Arquivos Disponíveis</h2>
        <div id="filesList" class="files-grid"></div>
    </div>

    <script>
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fazerUpload(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                fazerUpload(e.target.files[0]);
            }
        });

        async function fazerUpload(file) {
            const formData = new FormData();
            formData.append('arquivo', file);

            const progressBar = document.getElementById('progressBar');
            const progressFill = document.getElementById('progressFill');
            progressBar.style.display = 'block';

            try {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/upload');

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        progressFill.style.width = percentComplete + '%';
                        progressFill.textContent = Math.round(percentComplete) + '%';
                    }
                });

                xhr.onload = () => {
                    progressBar.style.display = 'none';
                    if (xhr.status === 200) {
                        const response = JSON.parse(xhr.responseText);
                        mostrarMensagem('Arquivo enviado com sucesso!', 'success');
                        carregarArquivos();
                        fileInput.value = '';
                    } else {
                        mostrarMensagem('Erro ao fazer upload', 'error');
                    }
                };

                xhr.onerror = () => {
                    progressBar.style.display = 'none';
                    mostrarMensagem('Erro de conexão', 'error');
                };

                xhr.send(formData);
            } catch (error) {
                progressBar.style.display = 'none';
                mostrarMensagem('Erro ao fazer upload', 'error');
            }
        }

        function mostrarMensagem(msg, tipo) {
            const messageDiv = document.getElementById('message');
            messageDiv.className = `message ${tipo}`;
            messageDiv.textContent = msg;
            messageDiv.style.display = 'block';
            
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 3000);
        }

        async function carregarArquivos() {
            try {
                const response = await fetch('/arquivos');
                const arquivos = await response.json();
                
                const filesList = document.getElementById('filesList');
                
                if (arquivos.length === 0) {
                    filesList.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Nenhum arquivo encontrado</p>';
                    return;
                }
                
                filesList.innerHTML = arquivos.map(arquivo => `
                    <div class="file-card">
                        ${gerarPreview(arquivo)}
                        <div class="file-name">${arquivo.nome}</div>
                        <button onclick="deletarArquivo('${arquivo.nome}')" class="delete-btn">
                            🗑️ Deletar
                        </button>
                    </div>
                `).join('');
            } catch (error) {
                mostrarMensagem('Erro ao carregar arquivos', 'error');
            }
        }

        function gerarPreview(arquivo) {
            const extensao = arquivo.extensao.toLowerCase();
            
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(extensao)) {
                return `<img src="${arquivo.url}" class="file-preview" alt="${arquivo.nome}">`;
            } else if (extensao === '.pdf') {
                return `<div style="font-size: 48px;">📄</div>`;
            } else if (['.mp4', '.webm'].includes(extensao)) {
                return `<video src="${arquivo.url}" class="file-preview" controls></video>`;
            } else if (['.mp3', '.wav'].includes(extensao)) {
                return `<div style="font-size: 48px;">🎵</div>`;
            } else if (extensao === '.txt') {
                return `<div style="font-size: 48px;">📝</div>`;
            } else {
                return `<div style="font-size: 48px;">📎</div>`;
            }
        }

        async function deletarArquivo(filename) {
            if (!confirm(`Deseja realmente deletar ${filename}?`)) return;
            
            try {
                const response = await fetch(`/arquivos/${filename}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    mostrarMensagem('Arquivo deletado com sucesso!', 'success');
                    carregarArquivos();
                } else {
                    mostrarMensagem('Erro ao deletar arquivo', 'error');
                }
            } catch (error) {
                mostrarMensagem('Erro ao deletar arquivo', 'error');
            }
        }

        // Carregar arquivos ao iniciar
        carregarArquivos();
    </script>
</body>
</html>
```

## Package.json

```json
{
  "name": "sistema-upload-arquivos",
  "version": "1.0.0",
  "description": "Sistema de upload e visualização de arquivos",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## Como usar:

1. **Instale as dependências:**
```bash
npm install
```

2. **Execute o servidor:**
```bash
npm start
# ou para desenvolvimento com auto-reload
npm run dev
```

3. **Acesse no navegador:**
```
http://localhost:3000
```

## Funcionalidades:

- ✅ Upload de arquivos (drag & drop)
- ✅ Barra de progresso
- ✅ Listagem de todos os arquivos
- ✅ Pré-visualização de imagens
- ✅ Deleção de arquivos
- ✅ Interface responsiva
- ✅ Suporte para vários tipos de arquivo (imagens, PDFs, vídeos, áudios, textos)
- ✅ Validação de tipo e tamanho de arquivo

O sistema cria automaticamente uma pasta `uploads` onde todos os arquivos são salvos e ficam disponíveis publicamente através da rota `/uploads`.
