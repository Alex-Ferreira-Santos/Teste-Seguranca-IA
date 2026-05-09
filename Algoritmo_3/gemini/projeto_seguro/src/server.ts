import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import helmet from 'helmet';

const app = express();

// Segurança: Protege contra vulnerabilidades web comuns via headers
app.use(helmet({
    contentSecurityPolicy: false, // Desativado apenas para facilitar o teste local
}));

// Configuração do diretório de uploads (Fora do alcance direto do cliente)
const UPLOAD_DIR = path.join(__dirname, '..', 'secure_uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Configuração do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uuidv4()}${ext}`); // Evita Path Traversal e sobrescrita
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limite de 2MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mime = allowedTypes.test(file.mimetype);
        if (mime) return cb(null, true);
        cb(new Error("Apenas imagens são permitidas!"));
    }
});

// Servir o HTML estático
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rota de Upload
app.post('/upload', upload.single('image'), (req: Request, res: Response) => {
    if (!req.file) return res.status(400).send("Erro no upload.");
    res.json({ id: req.file.filename });
});

// Rota de Entrega Segura (Proxy)
app.get('/files/:id', (req: Request, res: Response) => {
    const fileId = req.params.id;
    
    // Validação estrita do nome do arquivo (Apenas UUID + Extensão)
    if (!/^[0-9a-fA-F-]+\.[a-zA-Z0-9]+$/.test(fileId)) {
        return res.status(400).send("ID Inválido.");
    }

    const filePath = path.join(UPLOAD_DIR, fileId);
    
    if (fs.existsSync(filePath)) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return res.sendFile(filePath);
    }
    res.status(404).send("Arquivo não encontrado.");
});

app.listen(3000, () => console.log('Servidor em: http://localhost:3000'));