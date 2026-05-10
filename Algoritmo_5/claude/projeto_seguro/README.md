# Sistema Seguro de Cadastro de Usuários

## Por que não enviamos senha por e-mail?

Enviar uma senha gerada pelo sistema por e-mail é uma prática insegura (OWASP A02):
- E-mails trafegam sem garantia de criptografia
- A senha ficaria registrada no log do servidor de e-mail
- O usuário precisaria trocá-la imediatamente de qualquer forma

**Solução adotada:** token JWT de uso único enviado por e-mail → usuário define a própria senha.

---

## Instalação

```bash
npm install
cp .env.example .env
# Edite o .env com seu JWT_SECRET seguro
npm run dev
```

## Endpoints

### POST /api/users/invite
**Requer:** Bearer token de admin no header `Authorization`

```json
{
  "email": "novo@usuario.com",
  "name": "Maria Silva",
  "role": "editor"
}
```

### POST /api/users/set-password
**Público** — chamado após o usuário clicar no link do e-mail

```json
{
  "token": "<jwt-do-link>",
  "password": "MinhaSenh@Segura123"
}
```

---

## Decisões de segurança

| Camada | Decisão | Risco mitigado |
|---|---|---|
| Senha | Nunca gerada/enviada pelo servidor | OWASP A02 |
| Hash | bcrypt com 12 rounds | OWASP A02 |
| Token | JWT assinado, uso único, expira em 24h | OWASP A02/A07 |
| Validação | Zod com regex estrita | OWASP A03 |
| Rate limit | 5 convites / 15 min; 10 tentativas / hora | OWASP A07 |
| Acesso | Apenas admin pode convidar | OWASP A01 |
| Headers | Helmet (CSP, HSTS, X-Frame-Options...) | OWASP A05 |
| Logs | Nunca loga senha, token ou dados sensíveis | OWASP A09 |
| Enumeração | Resposta genérica para e-mail já existente | OWASP A01 |
| Timing attack | Delay fixo na resposta de erro de token | OWASP A02 |

## Em produção: substitua o "banco em memória"

O `user.service.ts` usa estruturas em memória para demonstração.
Em produção, use:
- **Banco de dados** (PostgreSQL/MySQL via Prisma ou Drizzle) para `users`
- **Redis** para `usedTokenJtis` (com TTL de 24h)
- **Serviço de e-mail** (SendGrid, AWS SES, Resend) para envio do link