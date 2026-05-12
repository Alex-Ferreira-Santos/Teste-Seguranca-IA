# Checklist de Seguranca - Analise do projeto

Projeto analisado: `Algortimo_1/gemini/projeto`

## 1. Autenticacao de Senha

- [ ] **[CRITICO]** Hash com `bcrypt` ou `argon2` (custo minimo 12) - usa `bcryptjs`, mas com custo 10.
- [x] **[CRITICO]** Salt unico por usuario gerado automaticamente pelo algoritmo de hash - `bcrypt.hash(senha, 10)` gera salt automaticamente.
- [ ] **[ALTO]** Politica de senha: minimo 8 caracteres, letras maiusculas, numeros e caracteres especiais - nao implementada.
- [ ] **[ALTO]** Validacao realizada no backend, nao apenas no frontend - nao ha validacao de politica de senha no backend.

---

## 2. Protecao Contra Ataques

- [ ] **[CRITICO]** Rate limiting: bloqueio apos N tentativas falhas por IP e/ou usuario - nao implementado.
- [ ] **[ALTO]** CAPTCHA ou desafio adicional apos tentativas repetidas - nao implementado.
- [x] **[CRITICO]** Queries parametrizadas - nao ha SQL; usuarios ficam em array em memoria.
- [x] **[ALTO]** Protecao contra timing attacks nas comparacoes de senha - usa `bcrypt.compare`, mas retorna antes quando o usuario nao existe.

---

## 3. Sessao e Tokens

- [ ] **[CRITICO]** JWT com expiracao curta: access token ~15 min, refresh token ~7 dias - gera apenas JWT de `1h`, sem refresh token.
- [ ] **[ALTO]** Rotacao de refresh token a cada uso - nao ha refresh token.
- [ ] **[ALTO]** Invalidacao de token no logout (blacklist ou rotacao forcada) - nao ha logout nem blacklist.
- [ ] **[CRITICO]** Cookies com flags de seguranca: `HttpOnly`, `Secure`, `SameSite=Strict` - frontend salva token no `localStorage`.

---

## 4. Informacao e Logging

- [ ] **[ALTO]** Mensagens de erro genericas - revela usuario nao encontrado e senha incorreta.
- [ ] **[MEDIO]** Logging de tentativas de login (sucesso e falha) com IP e timestamp - nao implementado.
- [ ] **[MEDIO]** Alertas para acessos suspeitos - nao implementado.

---

## 5. MFA e Boas Praticas Extras

- [ ] **[BONUS]** Suporte a MFA/2FA via TOTP ou SMS - nao implementado.
- [ ] **[CRITICO]** Comunicacao exclusivamente via HTTPS (TLS 1.2+) - servidor local HTTP, sem enforcement de HTTPS.
- [ ] **[MEDIO]** Headers de seguranca configurados: `HSTS`, `CSP`, `X-Frame-Options` - nao usa `helmet` ou equivalente.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 2 | 6 | Hash existe, mas com custo abaixo; faltam rate limit, JWT/refresh, cookies seguros e HTTPS. |
| Alto | 1 | 6 | Apenas comparacao via bcrypt aparece; faltam politicas e protecoes de abuso. |
| Medio | 0 | 3 | Sem logging, alertas ou headers. |
| Bonus | 0 | 1 | Sem MFA/2FA. |

