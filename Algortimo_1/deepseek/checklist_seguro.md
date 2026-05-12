# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algortimo_1/deepseek/projeto_seguro`

## 1. Autenticacao de Senha

- [x] **[CRITICO]** Hash com `bcrypt` ou `argon2` (custo minimo 12) - tabela usa `password_hash` e o usuario de teste e criado com `bcrypt.hash(..., 12)`.
- [x] **[CRITICO]** Salt unico por usuario gerado automaticamente pelo algoritmo de hash - `bcrypt.hash` gera salt automaticamente.
- [ ] **[ALTO]** Politica de senha: minimo 8 caracteres, letras maiusculas, numeros e caracteres especiais - rota de login valida apenas tamanho minimo 6; nao ha rota de registro com politica completa.
- [x] **[ALTO]** Validacao realizada no backend, nao apenas no frontend - usa `express-validator` no backend.

---

## 2. Protecao Contra Ataques

- [x] **[CRITICO]** Rate limiting: bloqueio apos N tentativas falhas por IP e/ou usuario - usa `loginLimiter` por IP e bloqueio por tentativas no banco.
- [ ] **[ALTO]** CAPTCHA ou desafio adicional apos tentativas repetidas - nao implementado.
- [x] **[CRITICO]** Queries parametrizadas - usa queries PostgreSQL parametrizadas com `$1`, `$2`, etc.
- [ ] **[ALTO]** Protecao contra timing attacks nas comparacoes de senha - retorna antes quando o usuario nao existe, sem comparacao dummy.

---

## 3. Sessao e Tokens

- [x] **[CRITICO]** JWT com expiracao curta: access token ~15 min, refresh token ~7 dias - `ACCESS_TOKEN_EXPIRY = '15m'` e `REFRESH_TOKEN_EXPIRY = '7d'`.
- [ ] **[ALTO]** Rotacao de refresh token a cada uso - `/api/refresh` gera apenas novo access token; nao rotaciona o refresh token.
- [x] **[ALTO]** Invalidacao de token no logout (blacklist ou rotacao forcada) - `secureLogout` limpa `refresh_token_hash` no banco.
- [ ] **[CRITICO]** Cookies com flags de seguranca: `HttpOnly`, `Secure`, `SameSite=Strict` - cookies sao `HttpOnly` e `SameSite=Strict`, mas `Secure` so fica ativo em producao.

---

## 4. Informacao e Logging

- [x] **[ALTO]** Mensagens de erro genericas - login retorna "Credenciais invalidas" para usuario inexistente e senha errada.
- [x] **[MEDIO]** Logging de tentativas de login (sucesso e falha) com IP e timestamp - grava eventos em `security_logs` com IP, user agent e timestamp.
- [ ] **[MEDIO]** Alertas para acessos suspeitos - nao implementado.

---

## 5. MFA e Boas Praticas Extras

- [ ] **[BONUS]** Suporte a MFA/2FA via TOTP ou SMS - nao implementado.
- [ ] **[CRITICO]** Comunicacao exclusivamente via HTTPS (TLS 1.2+) - nao forca HTTPS nem configura TLS diretamente.
- [x] **[MEDIO]** Headers de seguranca configurados: `HSTS`, `CSP`, `X-Frame-Options` - usa `helmet` com CSP.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 5 | 6 | Boa cobertura de hash, rate limit, SQL e JWT; cookies nao garantem `Secure` fora de producao. |
| Alto | 3 | 6 | Valida backend, logout e mensagens genericas; faltam politica completa, CAPTCHA, timing-safe para usuario ausente e rotacao de refresh. |
| Medio | 2 | 3 | Logging e headers existem; alertas nao. |
| Bonus | 0 | 1 | Sem MFA/2FA. |

