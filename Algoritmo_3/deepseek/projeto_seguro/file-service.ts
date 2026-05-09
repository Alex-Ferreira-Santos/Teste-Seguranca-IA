// file-service.ts
import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import mime from 'mime-types';

const app = express();

// Configurações de segurança
const SECURITY_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'text/plain'
  ],
  UPLOAD_DIR: path.join(__dirname, 'secure_uploads'),
  MAX_FILES_PER_USER: 50,
  FILE_EXPIRY_DAYS: 7,
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100
};

// Interfaces
interface UploadedFile {
  id: string;
  originalName: string;
  safeName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  expiresAt: Date;
  userId?: string;
}

// Banco de dados em memória (substituir por banco real em produção)
const fileDatabase = new Map<string, UploadedFile>();

// Middlewares de segurança
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const uploadLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS,
  max: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
  message: 'Muitas requisições, tente novamente mais tarde.'
});

// Sanitização de nome de arquivo
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.\./g, '')
    .substring(0, 255);
};

// Gerar ID seguro
const generateSecureId = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Verificar magic numbers de arquivos
const verifyFileMagicNumbers = async (filePath: string, expectedMimeType: string): Promise<boolean> {
  const buffer = await fs.readFile(filePath, { length: 8 });
  const signatures: Record<string, Buffer[]> = {
    'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
    'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
    'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])]
  };
  
  const expectedSignatures = signatures[expectedMimeType];
  if (!expectedSignatures) return true;
  
  return expectedSignatures.some(signature => 
    signature.equals(buffer.subarray(0, signature.length))
  );
};

// Configuração do multer com segurança
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(SECURITY_CONFIG.UPLOAD_DIR, { recursive: true });
    cb(null, SECURITY_CONFIG.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const sanitized = sanitizeFilename(file.originalname);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}-${sanitized}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const mimeType = file.mimetype;
  
  if (!SECURITY_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType)) {
    cb(new Error('Tipo de arquivo não permitido'));
    return;
  }
  
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: SECURITY_CONFIG.MAX_FILE_SIZE },
  fileFilter
});

// Middleware de autenticação (exemplo básico)
const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  
  if (!token) {
    // Se não tiver autenticação, continua sem userId (acesso anônimo limitado)
    req.userId = undefined;
    return next();
  }
  
  // Implementar validação real de token JWT
  try {
    // Exemplo: validar JWT
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Endpoint para upload de arquivo
app.post('/api/upload', 
  authenticateUser,
  uploadLimiter,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      // Verificar magic numbers
      const isValidMagicNumber = await verifyFileMagicNumbers(
        req.file.path,
        req.file.mimetype
      );
      
      if (!isValidMagicNumber) {
        await fs.unlink(req.file.path);
        return res.status(400).json({ error: 'Arquivo corrompido ou inválido' });
      }

      // Escanear com antivírus (exemplo com ClamAV)
      // await scanWithAntivirus(req.file.path);

      const fileId = generateSecureId();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + SECURITY_CONFIG.FILE_EXPIRY_DAYS);

      const fileRecord: UploadedFile = {
        id: fileId,
        originalName: sanitizeFilename(req.file.originalname),
        safeName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date(),
        expiresAt,
        userId: req.userId
      };

      fileDatabase.set(fileId, fileRecord);

      // Retornar URL segura (com token)
      const accessToken = crypto.randomBytes(32).toString('hex');
      const fileUrl = `/api/file/${fileId}?token=${accessToken}`;
      
      // Salvar token de acesso (em produção, usar Redis ou banco)
      // await saveAccessToken(fileId, accessToken, expiresAt);

      res.status(201).json({
        fileId,
        url: fileUrl,
        expiresAt: expiresAt.toISOString(),
        originalName: fileRecord.originalName,
        size: fileRecord.size
      });

    } catch (error) {
      // Limpar arquivo em caso de erro
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      next(error);
    }
  }
);

// Endpoint para servir arquivo
app.get('/api/file/:fileId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileId } = req.params;
      const { token } = req.query;
      
      // Validar token de acesso
      // if (!token || !await validateAccessToken(fileId, token)) {
      //   return res.status(403).json({ error: 'Acesso não autorizado' });
      // }

      const fileRecord = fileDatabase.get(fileId);
      
      if (!fileRecord) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }
      
      // Verificar expiração
      if (new Date() > fileRecord.expiresAt) {
        fileDatabase.delete(fileId);
        await fs.unlink(path.join(SECURITY_CONFIG.UPLOAD_DIR, fileRecord.safeName))
          .catch(console.error);
        return res.status(410).json({ error: 'Arquivo expirado' });
      }

      const filePath = path.join(SECURITY_CONFIG.UPLOAD_DIR, fileRecord.safeName);
      
      // Prevenir path traversal
      const resolvedPath = path.resolve(filePath);
      if (!resolvedPath.startsWith(path.resolve(SECURITY_CONFIG.UPLOAD_DIR))) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Configurar headers de segurança
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileRecord.originalName)}"`);
      res.setHeader('Content-Type', fileRecord.mimeType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; media-src 'self'");
      
      // Streaming seguro do arquivo
      const fileStream = require('fs').createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      next(error);
    }
  }
);

// Endpoint para listar arquivos do usuário
app.get('/api/user/files',
  authenticateUser,
  async (req: Request, res: Response) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }
    
    const userFiles = Array.from(fileDatabase.values())
      .filter(file => file.userId === req.userId)
      .map(file => ({
        id: file.id,
        originalName: file.originalName,
        size: file.size,
        uploadedAt: file.uploadedAt,
        expiresAt: file.expiresAt
      }));
    
    res.json(userFiles);
  }
);

// Endpoint para deletar arquivo
app.delete('/api/file/:fileId',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;
      const fileRecord = fileDatabase.get(fileId);
      
      if (!fileRecord) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }
      
      // Verificar permissão
      if (req.userId && fileRecord.userId !== req.userId) {
        return res.status(403).json({ error: 'Sem permissão para deletar' });
      }
      
      // Deletar arquivo físico e registro
      await fs.unlink(path.join(SECURITY_CONFIG.UPLOAD_DIR, fileRecord.safeName));
      fileDatabase.delete(fileId);
      
      res.json({ message: 'Arquivo deletado com sucesso' });
      
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar arquivo' });
    }
  }
);

// Cleanup automático de arquivos expirados
setInterval(async () => {
  const now = new Date();
  for (const [fileId, file] of fileDatabase.entries()) {
    if (now > file.expiresAt) {
      fileDatabase.delete(fileId);
      await fs.unlink(path.join(SECURITY_CONFIG.UPLOAD_DIR, file.safeName))
        .catch(console.error);
    }
  }
}, 24 * 60 * 60 * 1000); // Executar diariamente

// Handler de erro global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({ error: 'Arquivo muito grande' });
    }
    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
  }
  
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;