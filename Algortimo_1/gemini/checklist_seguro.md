# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algortimo_1/gemini/projeto_seguro`

## 1. Autenticacao de Senha

- [x] **[CRITICO]** Hash com `bcrypt` ou `argon2` (custo minimo 12) - usa `argon2.hash` para armazenar senhas.
- [x] **[CRITICO]** Salt unico por usuario gerado automaticamente pelo algoritmo de hash - Argon2 gera salt automaticamente.
- [ ] **[ALTO]** Politica de senha: minimo 8 caracteres, letras maiusculas, numeros e caracteres especiais - nao implementada.
- [ ] **[ALTO]** Validacao realizada no backend, nao apenas no frontend - nao ha validacao de politica de senha no backend.

---

## 2. Protecao Contra Ataques

- [x] **[CRITICO]** Rate limiting: bloqueio apos N tentativas falhas por IP e/ou usuario - usa `express-rate-limit` na rota de login, com 5 tentativas por IP.
- [ ] **[ALTO]** CAPTCHA ou desafio adicional apos tentativas repetidas - nao implementado.
- [x] **[CRITICO]** Queries parametrizadas - nao ha SQL; usuarios ficam em array em memoria.
- [x] **[ALTO]** Protecao contra timing attacks nas comparacoes de senha - usa `argon2.verify`, mas retorna antes quando o usuario nao existe.

---

## 3. Sessao e Tokens

- [ ] **[CRITICO]** JWT com expiracao curta: access token ~15 min, refresh token ~7 dias - gera apenas um token JWT de `1h`, sem refresh token.
- [ ] **[ALTO]** Rotacao de refresh token a cada uso - nao ha refresh token.
- [ ] **[ALTO]** Invalidacao de token no logout (blacklist ou rotacao forcada) - nao ha logout nem blacklist.
- [x] **[CRITICO]** Cookies com flags de seguranca: `HttpOnly`, `Secure`, `SameSite=Strict` - cookie `auth_token` usa essas flags.

---

## 4. Informacao e Logging

- [x] **[ALTO]** Mensagens de erro genericas - login retorna "Credenciais invalidas" para usuario ausente ou senha errada.
- [ ] **[MEDIO]** Logging de tentativas de login (sucesso e falha) com IP e timestamp - nao implementado.
- [ ] **[MEDIO]** Alertas para acessos suspeitos - nao implementado.

---

## 5. MFA e Boas Praticas Extras

- [ ] **[BONUS]** Suporte a MFA/2FA via TOTP ou SMS - nao implementado.
- [ ] **[CRITICO]** Comunicacao exclusivamente via HTTPS (TLS 1.2+) - cookie exige HTTPS, mas o app nao forca HTTPS nem configura TLS diretamente.
- [x] **[MEDIO]** Headers de seguranca configurados: `HSTS`, `CSP`, `X-Frame-Options` - usa `helmet()`.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 4 | 6 | Argon2, rate limit, ausencia de SQL e cookie seguro existem; faltam JWT/refresh adequado e HTTPS enforced. |
| Alto | 2 | 6 | Mensagens genericas e comparacao por Argon2 existem; faltam politica, CAPTCHA, refresh/logout. |
| Medio | 1 | 3 | Headers existem; logging e alertas ausentes. |
| Bonus | 0 | 1 | Sem MFA/2FA. |

