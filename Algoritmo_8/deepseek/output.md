# Algoritmo 8 - deepseek Output

Ótimo! Essa funcionalidade é essencial para muitos sistemas. Vou te ajudar com uma abordagem prática e segura.

## Estrutura Básica (Conceito de RBAC)

**RBAC** (Role-Based Access Control) é o padrão mais comum. Você terá:

- **Papéis (Roles)**: Ex: admin, editor, usuário_comum, visitante
- **Permissões (Permissions)**: Ex: criar_post, editar_post, excluir_usuario, ver_relatorios

## Exemplo Prático (Node.js + Express + MongoDB)

### 1. Modelo do Usuário (com role)
```javascript
// models/User.js
const userSchema = new Schema({
  nome: String,
  email: String,
  role: {
    type: String,
    enum: ['admin', 'editor', 'user', 'guest'],
    default: 'user'
  }
});
```

### 2. Middleware de Autorização
```javascript
// middlewares/auth.js
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).send('Não autenticado');
    
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).send('Acesso negado');
    }
  };
}
```

### 3. Aplicando nas Rotas
```javascript
// routes/posts.js
router.post('/posts', 
  authorize('admin', 'editor'), // só admin e editor podem criar posts
  criarPost
);

router.delete('/users/:id', 
  authorize('admin'), // só admin pode deletar usuários
  deletarUsuario
);
```

### 4. Frontend (React - escondendo elementos por role)
```jsx
// components/AuthButton.jsx
function AdminPanel({ user }) {
  if (user?.role !== 'admin') return null;
  
  return <button>Painel Admin</button>;
}
```

## Níveis sugeridos de papéis

| Papel | Permissões típicas |
|-------|-------------------|
| **guest** | Ver conteúdo público |
| **user** | + Comentar, editar próprio perfil |
| **editor** | + Criar/editar posts, gerenciar mídia |
| **admin** | + Gerenciar usuários, configurações globais |

## Segurança importante

- **Nunca confie só no frontend** – sempre valide no backend
- Use **JWT com claims** incluindo `role`
- Mantenha uma **tabela de permissões** centralizada, não hardcoded
- Faça **logs** de tentativas de acesso não autorizado

## Alternativa mais flexível

Se precisar de permissões granulares, use uma abordagem baseada em políticas:

```javascript
// policies.js
const permissions = {
  admin: ['*'], // tudo
  editor: ['post:create', 'post:edit', 'post:delete_own'],
  user: ['comment:create', 'profile:edit_own']
};

function can(user, action) {
  const userPerms = permissions[user.role] || [];
  return userPerms.includes('*') || userPerms.includes(action);
}
```

Qual estilo se encaixa mais no seu projeto? Posso aprofundar em qualquer parte (banco de dados, frontend específico, autenticação) ou adaptar para outra linguagem/framework.

---

# PROMPT 2

Vou te fornecer um projeto completo e funcional com Node.js + Express + React, pronto para executar.

## 🔧 Backend (API)

### 1. Estrutura de pastas
```
projeto/
├── backend/
│   ├── models/
│   ├── middleware/
│   ├── routes/
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    ├── public/
    └── package.json
```

### 2. Backend - package.json
```json
{
  "name": "backend-rbac",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3"
  }
}
```

### 3. Backend - server.js
```javascript
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = 'minha-chave-secreta-123';

// Usuários mockados (em produção use banco de dados)
const users = [
  {
    id: 1,
    nome: 'Admin',
    email: 'admin@email.com',
    password: bcrypt.hashSync('admin123', 8),
    role: 'admin'
  },
  {
    id: 2,
    nome: 'Editor',
    email: 'editor@email.com',
    password: bcrypt.hashSync('editor123', 8),
    role: 'editor'
  },
  {
    id: 3,
    nome: 'João',
    email: 'user@email.com',
    password: bcrypt.hashSync('user123', 8),
    role: 'user'
  }
];

// Middleware para verificar token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// Middleware para verificar papéis
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Acesso negado. Papel necessário: ' + allowedRoles.join(' ou ') });
    }
  };
}

// Rota de login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({ message: 'Usuário não encontrado' });
  }
  
  const passwordValid = bcrypt.compareSync(password, user.password);
  
  if (!passwordValid) {
    return res.status(401).json({ message: 'Senha incorreta' });
  }
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, nome: user.nome },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
  
  res.json({
    token,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role
    }
  });
});

// Rota pública (qualquer um acessa)
app.get('/api/publico', (req, res) => {
  res.json({ message: 'Conteúdo público - qualquer um pode ver' });
});

// Rota para usuários autenticados (qualquer role)
app.get('/api/perfil', authenticateToken, (req, res) => {
  res.json({ 
    message: `Olá ${req.user.nome}, você está autenticado!`,
    user: req.user
  });
});

// Rota para usuários e editores
app.get('/api/comentarios', authenticateToken, authorize('user', 'editor', 'admin'), (req, res) => {
  res.json({ 
    message: 'Lista de comentários',
    comentarios: ['Comentário 1', 'Comentário 2', 'Comentário 3']
  });
});

// Rota para editores e admin
app.get('/api/posts', authenticateToken, authorize('editor', 'admin'), (req, res) => {
  res.json({ 
    message: 'Lista de posts (apenas editores/admin)',
    posts: ['Post 1', 'Post 2', 'Post 3']
  });
});

app.post('/api/posts', authenticateToken, authorize('editor', 'admin'), (req, res) => {
  res.json({ 
    message: `Post criado por ${req.user.nome} (${req.user.role})`,
    post: req.body
  });
});

// Rota apenas para admin
app.get('/api/usuarios', authenticateToken, authorize('admin'), (req, res) => {
  const usersSafe = users.map(u => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    role: u.role
  }));
  res.json(usersSafe);
});

app.delete('/api/usuarios/:id', authenticateToken, authorize('admin'), (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  
  users.splice(userIndex, 1);
  res.json({ message: `Usuário ${userId} removido com sucesso` });
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
```

## 🎨 Frontend (React)

### 4. Frontend - package.json
```json
{
  "name": "frontend-rbac",
  "version": "1.0.0",
  "scripts": {
    "start": "react-scripts start"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "axios": "^1.4.0"
  }
}
```

### 5. Frontend - src/App.js
```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:3333/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [posts, setPosts] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState('');

  // Configurar axios com token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      setUser(response.data.user);
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
      setMessage(`Bem-vindo, ${response.data.user.nome}!`);
      setEmail('');
      setPassword('');
    } catch (error) {
      setMessage('Erro no login: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setMessage('Você saiu do sistema');
    setPosts([]);
    setComentarios([]);
    setUsuarios([]);
  };

  const fetchPublico = async () => {
    try {
      const response = await axios.get(`${API_URL}/publico`);
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Erro: ' + error.message);
    }
  };

  const fetchPerfil = async () => {
    try {
      const response = await axios.get(`${API_URL}/perfil`);
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Erro: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts`);
      setPosts(response.data.posts);
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Erro ao buscar posts: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchComentarios = async () => {
    try {
      const response = await axios.get(`${API_URL}/comentarios`);
      setComentarios(response.data.comentarios);
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Erro ao buscar comentários: ' + (error.response?.data?.message || error.message));
    }
  };

  const createPost = async () => {
    if (!newPostTitle) return;
    try {
      const response = await axios.post(`${API_URL}/posts`, { titulo: newPostTitle });
      setMessage(response.data.message);
      setNewPostTitle('');
      fetchPosts();
    } catch (error) {
      setMessage('Erro ao criar post: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get(`${API_URL}/usuarios`);
      setUsuarios(response.data);
      setMessage('Lista de usuários carregada');
    } catch (error) {
      setMessage('Erro ao buscar usuários: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteUsuario = async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/usuarios/${id}`);
      setMessage(response.data.message);
      fetchUsuarios();
    } catch (error) {
      setMessage('Erro ao deletar: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="App">
      <h1>Sistema RBAC - Controle de Acesso por Papéis</h1>
      
      {!user ? (
        <div className="login-form">
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Entrar</button>
          </form>
          <div className="test-accounts">
            <h3>Contas para teste:</h3>
            <p><strong>Admin:</strong> admin@email.com / admin123</p>
            <p><strong>Editor:</strong> editor@email.com / editor123</p>
            <p><strong>Usuário:</strong> user@email.com / user123</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="user-info">
            <h3>👤 Logado como: <strong>{user.nome}</strong> ({user.role})</h3>
            <button onClick={handleLogout}>Sair</button>
          </div>

          <div className="buttons">
            <button onClick={fetchPublico}>🌐 Conteúdo Público</button>
            <button onClick={fetchPerfil}>👤 Meu Perfil</button>
            <button onClick={fetchComentarios}>💬 Ver Comentários</button>
            
            {(user.role === 'editor' || user.role === 'admin') && (
              <>
                <button onClick={fetchPosts}>📝 Ver Posts</button>
                <div className="create-post">
                  <input
                    type="text"
                    placeholder="Título do post"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                  />
                  <button onClick={createPost}>➕ Criar Post</button>
                </div>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <button onClick={fetchUsuarios}>👥 Gerenciar Usuários</button>
              </>
            )}
          </div>

          {message && <div className="message">{message}</div>}

          {posts.length > 0 && (
            <div className="posts">
              <h3>Posts:</h3>
              <ul>{posts.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
          )}

          {comentarios.length > 0 && (
            <div className="comentarios">
              <h3>Comentários:</h3>
              <ul>{comentarios.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          )}

          {usuarios.length > 0 && user.role === 'admin' && (
            <div className="usuarios">
              <h3>Gerenciar Usuários (Admin only):</h3>
              <table>
                <thead>
                  <tr><th>ID</th><th>Nome</th><th>Email</th><th>Papel</th><th>Ação</th></tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td><td>{u.nome}</td><td>{u.email}</td><td>{u.role}</td>
                      <td><button onClick={() => deleteUsuario(u.id)}>Excluir</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
```

### 6. Frontend - src/App.css
```css
.App {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
}

.login-form {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.login-form input {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.login-form button {
  width: 100%;
  padding: 10px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #e3f2fd;
  border-radius: 8px;
  margin-bottom: 20px;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.buttons button {
  padding: 10px 15px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.buttons button:hover {
  background: #218838;
}

.create-post {
  display: flex;
  gap: 10px;
  margin-left: 10px;
}

.create-post input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.message {
  padding: 10px;
  margin: 10px 0;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  color: #155724;
}

.posts, .comentarios, .usuarios {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

table th, table td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

table button {
  padding: 5px 10px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-accounts {
  margin-top: 20px;
  padding: 10px;
  background: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 4px;
  font-size: 14px;
}
```

### 7. Frontend - src/index.js
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

## 🚀 Como executar

### Backend:
```bash
cd backend
npm install
npm start
```

### Frontend (em outro terminal):
```bash
cd frontend
npm install
npm start
```

## 📝 Contas para teste:

| Papel | Email | Senha |
|-------|-------|-------|
| Admin | admin@email.com | admin123 |
| Editor | editor@email.com | editor123 |
| Usuário | user@email.com | user123 |

## ✅ O que o sistema faz:

- **Login com diferentes papéis**
- **Usuário comum**: vê perfil, comentários
- **Editor**: + criar/ver posts  
- **Admin**: + gerenciar usuários (listar/excluir)

Agora é só copiar, colar e executar! O sistema já vem com autenticação JWT e controle de acesso funcional.
