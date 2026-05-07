# 🔐 Sistema de Login Seguro

Sistema de autenticação completo com TypeScript/Node.js no backend e HTML/CSS/JS no frontend, seguindo as melhores práticas de segurança da **OWASP Top 10**.

---

## 📁 Estrutura de Arquivos

```
login-system/
├── server/
│   ├── src/
│   │   ├── index.ts                  ← Servidor principal
│   │   ├── routes/
│   │   │   └── auth.ts               ← Rotas de autenticação
│   │   ├── services/
│   │   │   └── AuthService.ts        ← Lógica de negócio (hash, JWT)
│   │   ├── middleware/
│   │   │   ├── auth.ts               ← Proteção de rotas via JWT
│   │   │   └── validation.ts         ← Validação de entrada
│   │   └── models/
│   │       └── User.ts               ← Modelo de usuário
│   ├── package.json
│   └── tsconfig.json
├── public/
│   └── index.html                    ← Frontend completo
└── .env.example                      ← Variáveis de ambiente (copie para .env)
```

---

## 🚀 Como Instalar e Rodar

### Pré-requisitos
- [Node.js](https://nodejs.org) versão 18 ou superior

### Passo a passo

```bash
# 1. Entre na pasta do servidor
cd login-system/server

# 2. Instale as dependências
npm install

# 3. Crie o arquivo de configuração
cp ../.env.example ../.env
# Edite o .env e troque o JWT_SECRET por uma chave aleatória!

# 4. Compile o TypeScript
npm run build

# 5. Inicie o servidor
npm start

# O sistema estará disponível em: http://localhost:3000
```

---

## 🛡️ Proteções de Segurança Implementadas

| Ameaça OWASP | Proteção Implementada |
|---|---|
| **A01 - Broken Access Control** | JWT com expiração de 1h; middleware de autenticação em rotas protegidas |
| **A02 - Cryptographic Failures** | bcrypt com 12 rounds; JWT assinado; HTTPS headers via Helmet |
| **A03 - Injection** | Validação e sanitização de todos os inputs com a biblioteca `validator` |
| **A04 - Insecure Design** | Limite de tamanho de payload (10kb); confirmação de senha no registro |
| **A05 - Security Misconfiguration** | Helmet com CSP, HSTS, X-Frame-Options; CORS restritivo |
| **A07 - Auth Failures** | Rate limiting (10 tentativas / 15min); bloqueio após 5 falhas; mensagens genéricas |
| **A09 - Logging Failures** | Erros logados no servidor; stack trace nunca exposto ao cliente |

### Detalhes técnicos importantes

- **Senhas**: Hash com `bcrypt` (12 rounds). Nunca armazenadas em texto puro.
- **Timing Attacks**: Mesmo que o usuário não exista, `bcrypt.compare` sempre é executado para evitar diferenças de tempo que revelam se um e-mail está cadastrado.
- **Mensagens genéricas**: "E-mail ou senha inválidos" — nunca revela qual dos dois está errado.
- **Limite de senha**: Máximo de 128 caracteres para prevenir ataques DoS contra o bcrypt.
- **Rate Limiting**: 10 tentativas de login por IP a cada 15 minutos.
- **Bloqueio de conta**: Após 5 tentativas falhas, a conta é bloqueada por 15 minutos.

---

## ⚙️ Para Produção

### 1. Banco de Dados Real
O arquivo `server/src/models/User.ts` usa um `Map` em memória. **Em produção, substitua por um banco de dados real** (PostgreSQL, MySQL, MongoDB etc.). Os comentários no código indicam onde fazer a substituição.

### 2. Variáveis de Ambiente
```env
JWT_SECRET=gere_uma_chave_de_64_bytes_aleatorios_aqui
ALLOWED_ORIGIN=https://seudominio.com
```

Para gerar uma chave segura:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. HTTPS
Em produção, sempre use HTTPS. O Helmet já configura o header `Strict-Transport-Security` (HSTS).

---

## 📡 API Endpoints

| Método | Rota | Descrição | Rate Limit |
|---|---|---|---|
| `POST` | `/api/auth/register` | Cadastrar novo usuário | 10/15min |
| `POST` | `/api/auth/login` | Fazer login, recebe JWT | 10/15min |
| `GET` | `/api/auth/me` | Dados do usuário logado (🔒 requer token) | Global |

### Exemplo de uso da rota protegida:
```bash
curl -H "Authorization: Bearer SEU_TOKEN_AQUI" http://localhost:3000/api/auth/me
```

---

## 📋 Requisitos de Senha
- Mínimo 8 caracteres
- Ao menos 1 letra maiúscula
- Ao menos 1 letra minúscula
- Ao menos 1 número
- Ao menos 1 caractere especial (!@#$%...)