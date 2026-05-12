# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algortimo_1/chatGPT/projeto_seguro`

## 1. Autenticacao de Senha

- [x] **[CRITICO]** Hash com `bcrypt` ou `argon2` (custo minimo 12) - usa `bcrypt` com `SALT_ROUNDS = 12` em `src/utils/password.ts`.
- [x] **[CRITICO]** Salt unico por usuario gerado automaticamente pelo algoritmo de hash - `bcrypt.hash` gera salt automaticamente.
- [ ] **[ALTO]** Politica de senha: minimo 8 caracteres, letras maiusculas, numeros e caracteres especiais - valida minimo 8, maiuscula, minuscula e numero, mas nao exige caractere especial.
- [x] **[ALTO]** Validacao realizada no backend, nao apenas no frontend - usa schemas Zod em `auth.validation.ts`.

---

## 2. Protecao Contra Ataques

- [x] **[CRITICO]** Rate limiting: bloqueio apos N tentativas falhas por IP e/ou usuario - usa `express-rate-limit` em `/auth`, com limite de 10 requisicoes por IP a cada 15 minutos; nao diferencia apenas falhas.
- [ ] **[ALTO]** CAPTCHA ou desafio adicional apos tentativas repetidas - nao implementado.
- [x] **[CRITICO]** Queries parametrizadas - usa Prisma Client, evitando concatenacao manual de SQL.
- [x] **[ALTO]** Protecao contra timing attacks nas comparacoes de senha - usa `bcrypt.compare`; ainda ha diferenca de fluxo quando o usuario nao existe.

---

## 3. Sessao e Tokens

- [x] **[CRITICO]** JWT com expiracao curta: access token ~15 min, refresh token ~7 dias - `jwt.ts` define access token `15m` e refresh token `7d`.
- [ ] **[ALTO]** Rotacao de refresh token a cada uso - gera e armazena refresh token no login, mas nao ha rota de refresh para rotacao a cada uso.
- [ ] **[ALTO]** Invalidacao de token no logout (blacklist ou rotacao forcada) - logout apenas limpa o cookie; nao remove/invalida o refresh token salvo no banco.
- [x] **[CRITICO]** Cookies com flags de seguranca: `HttpOnly`, `Secure`, `SameSite=Strict` - refresh token e enviado em cookie com essas flags.

---

## 4. Informacao e Logging

- [x] **[ALTO]** Mensagens de erro genericas - login e cadastro usam erro generico, e o middleware retorna `Request error`.
- [ ] **[MEDIO]** Logging de tentativas de login (sucesso e falha) com IP e timestamp - nao implementado.
- [ ] **[MEDIO]** Alertas para acessos suspeitos - nao implementado.

---

## 5. MFA e Boas Praticas Extras

- [ ] **[BONUS]** Suporte a MFA/2FA via TOTP ou SMS - nao implementado.
- [ ] **[CRITICO]** Comunicacao exclusivamente via HTTPS (TLS 1.2+) - cookies exigem `Secure`, mas o app nao forca HTTPS nem configura TLS diretamente.
- [x] **[MEDIO]** Headers de seguranca configurados: `HSTS`, `CSP`, `X-Frame-Options` - usa `helmet()` em `app.ts`.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 5 | 6 | Falta enforcement claro de HTTPS/TLS na aplicacao. |
| Alto | 4 | 6 | Faltam CAPTCHA/desafio e rotacao real de refresh token. |
| Medio | 1 | 3 | Headers existem via Helmet, mas nao ha logging nem alertas. |
| Bonus | 0 | 1 | Sem MFA/2FA. |

