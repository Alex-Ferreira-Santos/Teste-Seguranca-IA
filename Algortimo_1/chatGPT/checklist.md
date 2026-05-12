# Checklist de Seguranca - Analise do projeto

Projeto analisado: `Algortimo_1/chatGPT/projeto`

## 1. Autenticacao de Senha

- [ ] **[CRITICO]** Hash com `bcrypt` ou `argon2` (custo minimo 12) - usa `bcryptjs`, porem com custo 10 em `server.js`.
- [x] **[CRITICO]** Salt unico por usuario gerado automaticamente pelo algoritmo de hash - `bcrypt.hash(password, 10)` gera salt automaticamente.
- [ ] **[ALTO]** Politica de senha: minimo 8 caracteres, letras maiusculas, numeros e caracteres especiais - o cadastro valida apenas se a senha foi enviada.
- [ ] **[ALTO]** Validacao realizada no backend, nao apenas no frontend - ha validacao basica de campo obrigatorio no backend, mas nao ha politica de senha.

---

## 2. Protecao Contra Ataques

- [ ] **[CRITICO]** Rate limiting: bloqueio apos N tentativas falhas por IP e/ou usuario - nao ha middleware de rate limiting ou controle de tentativas.
- [ ] **[ALTO]** CAPTCHA ou desafio adicional apos tentativas repetidas - nao implementado.
- [x] **[CRITICO]** Queries parametrizadas - usa placeholders `?` no SQLite para cadastro e login.
- [x] **[ALTO]** Protecao contra timing attacks nas comparacoes de senha - usa `bcrypt.compare`, mas ainda permite enumeracao por diferenca de fluxo quando o usuario nao existe.

---

## 3. Sessao e Tokens

- [ ] **[CRITICO]** JWT com expiracao curta: access token ~15 min, refresh token ~7 dias - gera apenas um JWT com expiracao de `1d`.
- [ ] **[ALTO]** Rotacao de refresh token a cada uso - nao ha refresh token.
- [ ] **[ALTO]** Invalidacao de token no logout (blacklist ou rotacao forcada) - nao ha rota de logout nem blacklist.
- [ ] **[CRITICO]** Cookies com flags de seguranca: `HttpOnly`, `Secure`, `SameSite=Strict` - token e armazenado no `localStorage` pelo frontend.

---

## 4. Informacao e Logging

- [ ] **[ALTO]** Mensagens de erro genericas - retorna mensagens diferentes para usuario inexistente, senha invalida e usuario ja existente.
- [ ] **[MEDIO]** Logging de tentativas de login (sucesso e falha) com IP e timestamp - nao implementado.
- [ ] **[MEDIO]** Alertas para acessos suspeitos - nao implementado.

---

## 5. MFA e Boas Praticas Extras

- [ ] **[BONUS]** Suporte a MFA/2FA via TOTP ou SMS - nao implementado.
- [ ] **[CRITICO]** Comunicacao exclusivamente via HTTPS (TLS 1.2+) - servidor local HTTP, sem enforcement de HTTPS.
- [ ] **[MEDIO]** Headers de seguranca configurados: `HSTS`, `CSP`, `X-Frame-Options` - nao usa `helmet` nem configuracao equivalente.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 2 | 6 | Hash existe, mas custo abaixo do minimo; JWT/cookies/HTTPS/rate limit ausentes. |
| Alto | 1 | 6 | Apenas comparacao via bcrypt foi identificada; varias protecoes ausentes. |
| Medio | 0 | 3 | Sem logging, alertas ou headers de seguranca. |
| Bonus | 0 | 1 | Sem MFA/2FA. |

