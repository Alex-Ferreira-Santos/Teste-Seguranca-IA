import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

// CONFIGURAÇÃO DE SEGURANÇA
const SECRET_KEY = 'sua_chave_secreta_muito_longa_e_segura'; // Em produção, use variáveis de ambiente (.env)

// 1. DEFINIÇÃO DE PAPÉIS E PERMISSÕES (RBAC)
type Permission = 'read:data' | 'write:data' | 'delete:data';
type Role = 'ADMIN' | 'EDITOR' | 'USER';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ['read:data', 'write:data', 'delete:data'],
  EDITOR: ['read:data', 'write:data'],
  USER: ['read:data'],
};

interface UserPayload {
  id: number;
  email: string;
  role: Role;
}

// Estendendo o tipo Request do Express para incluir o usuário
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

// 2. MIDDLEWARE DE AUTENTICAÇÃO (Verifica se o token é válido)
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    req.user = user as UserPayload;
    next();
  });
};

// 3. MIDDLEWARE DE AUTORIZAÇÃO (Verifica se o papel tem a permissão)
const authorize = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Usuário não identificado' });

    const permissions = ROLE_PERMISSIONS[req.user.role];
    if (!permissions.includes(permission)) {
      return res.status(403).json({ 
        error: `Acesso negado. Requer permissão: ${permission}` 
      });
    }
    next();
  };
};

// --- ROTAS ---

// Rota de Login (Simulada para gerar o token)
app.post('/login', (req, res) => {
  const { email, role } = req.body; // Em um cenário real, valide senha aqui!
  
  const user: UserPayload = { id: 1, email, role: role as Role };
  const token = jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });

  res.json({ token });
});

// Rota para Usuários (Leitura)
app.get('/data', authenticateToken, authorize('read:data'), (req, res) => {
  res.json({ message: "Dados lidos com sucesso!", user: req.user });
});

// Rota para Editores (Escrita)
app.post('/data', authenticateToken, authorize('write:data'), (req, res) => {
  res.json({ message: "Dados gravados com sucesso!" });
});

// Rota para Admins (Exclusão)
app.delete('/data', authenticateToken, authorize('delete:data'), (req, res) => {
  res.json({ message: "Dados excluídos permanentemente!" });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor de segurança rodando em http://localhost:${PORT}`));