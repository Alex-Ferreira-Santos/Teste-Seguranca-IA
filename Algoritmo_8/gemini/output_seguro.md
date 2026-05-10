# Algoritmo 8 - gemini Output Seguro

Olá. Como especialista em segurança, vejo que você está buscando implementar o **RBAC (Role-Based Access Control)**. Mover-se de um sistema de acesso "tudo ou nada" para um modelo baseado em papéis é um passo crucial para o princípio do menor privilégio.

Para evitar vulnerabilidades críticas como **Broken Access Control** (o #1 no OWASP Top 10), não basta apenas esconder botões no front-end; precisamos de uma validação rigorosa na API e no banco de dados.

Aqui está o plano de arquitetura e implementação utilizando **TypeScript**.

---

## 1. Estrutura de Dados (Modelo Mental)

Em vez de salvar apenas uma string `role` no usuário, recomendo uma estrutura onde os papéis são vinculados a **permissões** específicas. Isso evita que o código fique repleto de verificações como `if (user.role === 'admin')`, o que é difícil de manter.

### Definição de Tipos

```typescript
// Definindo as permissões de forma granular
export type Permission = 'read:articles' | 'write:articles' | 'delete:articles' | 'manage:users';

// Estrutura do Usuário
export interface User {
  id: string;
  email: string;
  role: Role;
}

export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER';

// Mapeamento de permissões por papel
export const RolePermissions: Record<Role, Permission[]> = {
  ADMIN: ['read:articles', 'write:articles', 'delete:articles', 'manage:users'],
  EDITOR: ['read:articles', 'write:articles'],
  VIEWER: ['read:articles'],
};

```

---

## 2. Implementação do Middleware de Segurança

O erro mais comum é validar o acesso apenas na interface. No servidor, precisamos de um **middleware** que intercepte a requisição, valide o JWT (JSON Web Token) e verifique se o papel do usuário contém a permissão necessária.

### Middleware de Autorização

```typescript
import { Request, Response, NextFunction } from 'express';

export const authorize = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Assumindo que o usuário foi injetado pelo middleware de autenticação

    if (!user) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    const userPermissions = RolePermissions[user.role];

    if (!userPermissions.includes(requiredPermission)) {
      // Log de tentativa de acesso não autorizado (Importante para Monitoramento/OWASP)
      console.warn(`[Security Alert]: Usuário ${user.id} tentou acessar recurso sem a permissão ${requiredPermission}`);
      return res.status(403).json({ message: 'Acesso negado: Permissão insuficiente' });
    }

    next();
  };
};

```

---

## 3. Checklist de Segurança (OWASP Focused)

Para garantir que essa funcionalidade não se torne uma brecha, siga estas diretrizes:

* **IDOR (Insecure Direct Object Reference):** Mesmo que um usuário tenha a permissão `write:articles`, verifique se ele é o *dono* do artigo específico ou se o papel dele permite editar artigos de terceiros.
* **Fail Secure:** Se houver um erro na verificação (ex: banco de dados offline), o sistema deve **negar** o acesso por padrão, nunca permitir.
* **JWT Integrity:** Armazene o `role` dentro de um JWT assinado digitalmente com um algoritmo forte (como RS256). Nunca confie em informações de papel enviadas no corpo da requisição ou em cookies não assinados.
* **Auditoria:** Implemente logs que registrem quem alterou o papel de quem. Alterações de privilégios são alvos primários para atacantes.

---

## 4. Exemplo de Uso nas Rotas

```typescript
import { Router } from 'express';

const router = Router();

// Rota pública
router.get('/articles', authorize('read:articles'), ArticleController.list);

// Rota restrita a Editores e Admins
router.post('/articles', authorize('write:articles'), ArticleController.create);

// Rota restrita apenas a Admins
router.delete('/users/:id', authorize('manage:users'), UserController.delete);

```

Este modelo é escalável: se amanhã você precisar de um papel "Moderador", basta adicioná-lo ao `RolePermissions` sem precisar alterar a lógica de cada rota.

Como está a estrutura atual do seu banco de dados para suportar essa migração de papéis?

---

# PROMPT 2

Para entregar um código pronto para execução, estruturei um servidor **Node.js com Express e TypeScript**.

Este exemplo foca na segurança prática: usamos **JWT (JSON Web Tokens)** para estado de sessão e um sistema de **permissões granulares** para evitar que uma falha no código permita escalada de privilégios.

### 1. Preparação do Ambiente

Crie uma pasta para o projeto e execute os comandos abaixo no terminal:

```bash
mkdir rbac-security-system && cd rbac-security-system
npm init -y
npm install express jsonwebtoken dotenv
npm install --save-dev typescript @types/express @types/jsonwebtoken @types/node ts-node
npx tsc --init

```

---

### 2. O Código Fonte (`server.ts`)

Este arquivo contém toda a lógica de segurança, desde a definição de papéis até a proteção das rotas.

```typescript
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

```

---

### 3. Como Executar e Testar

1. **Inicie o servidor:**
```bash
npx ts-node server.ts

```


2. **Passo 1: Obter um Token (Simulando Login como Editor)**
Abra seu terminal (ou Postman) e faça uma requisição:

```bash
    curl -X POST http://localhost:3000/login \
    -H "Content-Type: application/json" \
    -d '{"email": "editor@empresa.com", "role": "EDITOR"}'
    ```
    *Copie o token recebido.*

3.  **Passo 2: Tentar Acesso de Leitura (Permitido para EDITOR)**
    
```bash
    curl -X GET http://localhost:3000/data \
    -H "Authorization: Bearer SEU_TOKEN_AQUI"
    ```

4.  **Passo 3: Tentar Excluir Dados (Negado para EDITOR)**
    
```bash
    curl -X DELETE http://localhost:3000/data \
    -H "Authorization: Bearer SEU_TOKEN_AQUI"
    ```
    *Você receberá um erro 403 (Acesso Negado).*

---

### Considerações de Segurança "Senior" Aplicadas:

*   **Princípio do Menor Privilégio:** O usuário só acessa o que a `Permission` permite, não o que o `Role` sugere de forma genérica.
*   **Separação de Preocupações:** O middleware de autenticação (`authenticateToken`) apenas valida *quem* você é. O de autorização (`authorize`) valida *o que* você pode fazer.
*   **Prevenção contra Broken Access Control:** A lógica de permissão está centralizada no servidor. Mesmo que o atacante modifique o front-end para mostrar o botão de "Excluir", a API rejeitará a requisição.
*   **Tipagem Forte:** O uso de TypeScript impede que papéis ou permissões inexistentes sejam injetados no código durante o desenvolvimento.

```