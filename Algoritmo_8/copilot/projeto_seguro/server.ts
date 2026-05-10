import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());

const PORT = 3000;

// Simulação de banco de dados em memória
interface User {
  id: number;
  username: string;
  passwordHash: string;
  roles: string[];
}

const users: User[] = [];

// Papéis e permissões
const roles: Record<string, string[]> = {
  admin: ['user:create', 'user:delete', 'post:delete'],
  editor: ['post:create', 'post:update'],
  viewer: ['post:read']
};

// Função para gerar token JWT
function generateToken(user: User) {
  return jwt.sign(
    { id: user.id, username: user.username, roles: user.roles },
    process.env.JWT_SECRET!,
    { expiresIn: '15m', algorithm: 'HS256' }
  );
}

// Middleware de autorização
function authorize(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token ausente' });

    try {
      const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
      const userPermissions = payload.roles.flatMap((role: string) => roles[role] || []);
      if (!userPermissions.includes(permission)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      (req as any).user = payload;
      next();
    } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }
  };
}

// Registro de usuário
app.post('/register', async (req: Request, res: Response) => {
  const { username, password, roles } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Dados inválidos' });

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: User = { id: users.length + 1, username, passwordHash, roles: roles || ['viewer'] };
  users.push(newUser);

  res.json({ message: 'Usuário registrado com sucesso' });
});

// Login
app.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = generateToken(user);
  res.json({ token });
});

// Rotas protegidas
app.post('/posts', authorize('post:create'), (req: Request, res: Response) => {
  res.json({ message: 'Post criado com sucesso!' });
});

app.get('/posts', authorize('post:read'), (req: Request, res: Response) => {
  res.json({ message: 'Lista de posts visível!' });
});

app.delete('/users/:id', authorize('user:delete'), (req: Request, res: Response) => {
  res.json({ message: `Usuário ${req.params.id} deletado com sucesso!` });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
