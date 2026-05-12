# Checklist de Seguranca - Analise do projeto

Projeto analisado: `Algortimo_1/deepseek/projeto`

## 1. Autenticacao de Senha

- [ ] **[CRITICO]** Hash com `bcrypt` ou `argon2` (custo minimo 12) - usa uma "criptografia" caseira por deslocamento de caracteres.
- [ ] **[CRITICO]** Salt unico por usuario gerado automaticamente pelo algoritmo de hash - nao ha salt.
- [ ] **[ALTO]** Politica de senha: minimo 8 caracteres, letras maiusculas, numeros e caracteres especiais - exige apenas 6 caracteres, letras e numeros.
- [ ] **[ALTO]** Validacao realizada no backend, nao apenas no frontend - toda a logica roda no navegador.

---

## 2. Protecao Contra Ataques

- [ ] **[CRITICO]** Rate limiting: bloqueio apos N tentativas falhas por IP e/ou usuario - nao implementado.
- [ ] **[ALTO]** CAPTCHA ou desafio adicional apos tentativas repetidas - nao implementado.
- [x] **[CRITICO]** Queries parametrizadas - nao ha SQL; dados ficam em `localStorage`.
- [ ] **[ALTO]** Protecao contra timing attacks nas comparacoes de senha - compara hash caseiro diretamente em memoria.

---

## 3. Sessao e Tokens

- [ ] **[CRITICO]** JWT com expiracao curta: access token ~15 min, refresh token ~7 dias - nao usa JWT; usa sessao em `sessionStorage` por 24h.
- [ ] **[ALTO]** Rotacao de refresh token a cada uso - nao ha refresh token.
- [ ] **[ALTO]** Invalidacao de token no logout (blacklist ou rotacao forcada) - logout remove sessao local, mas nao ha token server-side para invalidar.
- [ ] **[CRITICO]** Cookies com flags de seguranca: `HttpOnly`, `Secure`, `SameSite=Strict` - nao usa cookies seguros.

---

## 4. Informacao e Logging

- [ ] **[ALTO]** Mensagens de erro genericas - cadastro, recuperacao e alteracao de senha revelam detalhes como e-mail existente/nao encontrado.
- [ ] **[MEDIO]** Logging de tentativas de login (sucesso e falha) com IP e timestamp - registra apenas `ultimoLogin`, sem IP e sem falhas.
- [ ] **[MEDIO]** Alertas para acessos suspeitos - nao implementado.

---

## 5. MFA e Boas Praticas Extras

- [ ] **[BONUS]** Suporte a MFA/2FA via TOTP ou SMS - nao implementado.
- [ ] **[CRITICO]** Comunicacao exclusivamente via HTTPS (TLS 1.2+) - aplicacao e inteiramente local no navegador, sem enforcement de HTTPS.
- [ ] **[MEDIO]** Headers de seguranca configurados: `HSTS`, `CSP`, `X-Frame-Options` - nao ha servidor configurando headers.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 1 | 6 | Nao ha SQL, mas autenticacao e sessao ficam inseguras e client-side. |
| Alto | 0 | 6 | Faltam politica forte, backend, CAPTCHA, timing-safe compare, refresh e mensagens genericas. |
| Medio | 0 | 3 | Sem logs adequados, alertas ou headers. |
| Bonus | 0 | 1 | Sem MFA/2FA. |

