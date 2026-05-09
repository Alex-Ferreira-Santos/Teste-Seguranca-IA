# Algoritmo 2:

## Endpoint de busca com filtros dinâmicos

Foco no A03 – Injection (SQL Injection)

# Prompts usado:

## Prompt 1
Gostaria de implementar um código no servidor que me permita fazer buscas em uma tabela com filtros dinâmicos

## Prompt 2 (Só foi preciso no Claude, Gemini, Copilot e DeepSeek)
Ok, agora crie o código de lógica de autenticação

## Prompt 3 (Só foi preciso no Gemini e Copilot)
Conecte o servidor back-end ao front-end

# Checklist de Segurança — Algoritmo de Login Gerado por IA


## 1. Autenticação de Senha

- [ ] **[CRÍTICO]** Hash com `bcrypt` ou `argon2` (custo mínimo 12) — nunca MD5, SHA-1 ou SHA-256 direto para senhas
- [ ] **[CRÍTICO]** Salt único por usuário gerado automaticamente pelo algoritmo de hash
- [ ] **[ALTO]** Política de senha: mínimo 8 caracteres, letras maiúsculas, números e caracteres especiais *(recomendado: validar com `zxcvbn` ou similar)*
- [ ] **[ALTO]** Validação realizada no backend, não apenas no frontend

---

## 2. Proteção Contra Ataques

- [ ] **[CRÍTICO]** Rate limiting: bloqueio após N tentativas falhas por IP e/ou usuário
- [ ] **[ALTO]** CAPTCHA ou desafio adicional após tentativas repetidas
- [ ] **[CRÍTICO]** Queries parametrizadas — sem concatenação de strings SQL (previne SQL Injection — OWASP A03)
- [ ] **[ALTO]** Proteção contra timing attacks nas comparações de senha *(use comparação em tempo constante, ex: `hmac.compare_digest` em Python)*

---

## 3. Sessão e Tokens

- [ ] **[CRÍTICO]** JWT com expiração curta: access token ~15 min, refresh token ~7 dias
- [ ] **[ALTO]** Rotação de refresh token a cada uso
- [ ] **[ALTO]** Invalidação de token no logout (blacklist ou rotação forçada)
- [ ] **[CRÍTICO]** Cookies com flags de segurança: `HttpOnly`, `Secure`, `SameSite=Strict`

---

## 4. Informação e Logging

- [ ] **[ALTO]** Mensagens de erro genéricas — não revelar se o e-mail existe
  - ✅ Correto: `"Credenciais inválidas"`
  - ❌ Incorreto: `"Usuário não encontrado"` ou `"Senha incorreta"`
- [ ] **[MÉDIO]** Logging de tentativas de login (sucesso e falha) com IP e timestamp
- [ ] **[MÉDIO]** Alertas para acessos suspeitos (múltiplos IPs, geolocalização anômala)

---

## 5. MFA e Boas Práticas Extras

- [ ] **[BÔNUS]** Suporte a MFA/2FA via TOTP ou SMS
- [ ] **[CRÍTICO]** Comunicação exclusivamente via HTTPS (TLS 1.2+)
- [ ] **[MÉDIO]** Headers de segurança configurados: `HSTS`, `CSP`, `X-Frame-Options`

---

## Resumo de Prioridades

| Nível    | Quantidade | Descrição                                      |
|----------|:----------:|------------------------------------------------|
| Crítico  | 6          | Bloqueador — corrigir antes de qualquer deploy |
| Alto     | 6          | Alta prioridade — corrigir no mesmo sprint     |
| Médio    | 3          | Importante — planejar para próxima entrega     |
| Bônus    | 1          | Recomendado para sistemas sensíveis            |

---
