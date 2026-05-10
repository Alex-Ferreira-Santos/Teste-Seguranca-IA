# Sistema de Convites por E-mail

Cadastro de usuários com link de convite seguro. O admin cadastra o usuário e ele recebe um e-mail para definir a própria senha.

## Estrutura

```
invite-system/
├── server.js          ← Ponto de entrada
├── db.js              ← Banco SQLite (criado automaticamente)
├── mailer.js          ← Envio de e-mails
├── routes/
│   └── index.js       ← Todas as rotas da API
├── public/
│   ├── admin.html     ← Painel do administrador
│   └── convite.html   ← Página para o usuário definir a senha
├── .env.example       ← Modelo de configuração
└── package.json
```

## Como rodar

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar o .env
```bash
cp .env.example .env
```
Edite o `.env` com seus dados de SMTP.

**Para Gmail**, crie uma "Senha de app" em:
https://myaccount.google.com/apppasswords
(Precisa ter verificação em 2 etapas ativa)

### 3. Iniciar o servidor
```bash
# Produção
npm start

# Desenvolvimento (com hot reload)
npm run dev
```

### 4. Acessar

| URL | Descrição |
|-----|-----------|
| `http://localhost:3000/admin` | Painel do administrador |
| `http://localhost:3000/convite?token=...` | Página do usuário (enviada por e-mail) |

## Fluxo completo

1. Admin acessa `/admin` e cadastra nome + e-mail
2. Sistema gera token único (válido por 48h) e salva no banco
3. E-mail com link é enviado automaticamente
4. Usuário clica no link, define a senha
5. Token é invalidado, conta fica ativa

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/users` | Lista todos os usuários |
| POST | `/api/users` | Cadastra usuário e envia convite |
| POST | `/api/users/:id/reenviar` | Reenvia convite |
| DELETE | `/api/users/:id` | Remove usuário |
| GET | `/api/convite/verificar?token=` | Valida token |
| POST | `/api/convite/definir-senha` | Define senha e ativa conta |

## Segurança

- Tokens gerados com `crypto.randomBytes(32)` (256 bits)
- Senhas com hash `bcrypt` (custo 12)
- Tokens expiram em 48 horas
- Tokens invalidados após o primeiro uso
- Senhas nunca são armazenadas em texto puro
