# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algortimo_1/copilot/projeto_seguro`

## 1. Autenticacao de Senha

- [x] **[CRITICO]** Hash com `bcrypt` ou `argon2` (custo minimo 12) - usa `bcrypt` com `saltRounds = 12`.
- [x] **[CRITICO]** Salt unico por usuario gerado automaticamente pelo algoritmo de hash - `bcrypt.hash` gera salt automaticamente.
- [ ] **[ALTO]** Politica de senha: minimo 8 caracteres, letras maiusculas, numeros e caracteres especiais - nao implementada.
- [ ] **[ALTO]** Validacao realizada no backend, nao apenas no frontend - backend verifica campos obrigatorios, mas nao valida politica de senha.

---

## 2. Protecao Contra Ataques

- [ ] **[CRITICO]** Rate limiting: bloqueio apos N tentativas falhas por IP e/ou usuario - nao implementado.
- [ ] **[ALTO]** CAPTCHA ou desafio adicional apos tentativas repetidas - nao implementado.
- [x] **[CRITICO]** Queries parametrizadas - usa placeholders `?` nas queries SQLite.
- [x] **[ALTO]** Protecao contra timing attacks nas comparacoes de senha - usa `bcrypt.compare`, mas retorna antes quando o usuario nao existe.

---

## 3. Sessao e Tokens

- [ ] **[CRITICO]** JWT com expiracao curta: access token ~15 min, refresh token ~7 dias - usa `express-session`, nao JWT com access/refresh tokens.
- [ ] **[ALTO]** Rotacao de refresh token a cada uso - nao ha refresh token.
- [x] **[ALTO]** Invalidacao de token no logout (blacklist ou rotacao forcada) - logout destroi a sessao server-side com `req.session.destroy`.
- [ ] **[CRITICO]** Cookies com flags de seguranca: `HttpOnly`, `Secure`, `SameSite=Strict` - cookie de sessao e `HttpOnly`, mas `secure` esta `false` e nao ha `SameSite=Strict`.

---

## 4. Informacao e Logging

- [ ] **[ALTO]** Mensagens de erro genericas - login e generico, mas cadastro revela usuario ja existente.
- [ ] **[MEDIO]** Logging de tentativas de login (sucesso e falha) com IP e timestamp - nao implementado.
- [ ] **[MEDIO]** Alertas para acessos suspeitos - nao implementado.

---

## 5. MFA e Boas Praticas Extras

- [ ] **[BONUS]** Suporte a MFA/2FA via TOTP ou SMS - nao implementado.
- [ ] **[CRITICO]** Comunicacao exclusivamente via HTTPS (TLS 1.2+) - nao forca HTTPS e o cookie seguro esta desativado.
- [x] **[MEDIO]** Headers de seguranca configurados: `HSTS`, `CSP`, `X-Frame-Options` - usa `helmet()`.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 3 | 6 | Hash e queries estao melhores; faltam rate limit, JWT conforme checklist, cookies seguros e HTTPS. |
| Alto | 2 | 6 | Logout de sessao e bcrypt existem; faltam politica, CAPTCHA, refresh token e mensagens totalmente genericas. |
| Medio | 1 | 3 | Headers existem; logging e alertas ausentes. |
| Bonus | 0 | 1 | Sem MFA/2FA. |

