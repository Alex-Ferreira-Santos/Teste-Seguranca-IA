# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_5/deepseek/projeto_seguro`

## 1. Geracao e armazenamento de senha

- [ ] **[CRITICO]** A senha temporaria e gerada com entropia suficiente - usuario informa senha forte; nao ha senha temporaria.
- [x] **[CRITICO]** A senha nunca e armazenada em texto plano - salva `password_hash`.
- [x] **[CRITICO]** O algoritmo de hash utilizado e bcrypt, Argon2 ou scrypt - usa bcrypt com rounds configuraveis, default 12.
- [ ] **[CRITICO]** O usuario e obrigado a trocar a senha no primeiro acesso - senha e definida no cadastro.
- [ ] **[CRITICO]** Senhas temporarias tem prazo de expiracao e sao invalidadas apos o uso - gera `activation_token`, mas nao ha rota de ativacao/expiracao de token implementada.

## 2. Transmissao da senha ao usuario

- [ ] **[CRITICO]** A senha e enviada apenas por canal seguro - nao envia senha, mas tambem nao implementa envio de link.
- [ ] **[CRITICO]** O sistema prefere enviar um link de definicao de senha - nao implementado; cadastro recebe senha direta.
- [x] **[IMPORTANTE]** A senha ou link nao e registrado em logs - logs nao incluem senha.
- [ ] **[CRITICO]** O link de definicao de senha e de uso unico e invalidado apos utilizacao ou expiracao - nao implementado.

## 3. Cadastro e validacao de dados

- [x] **[CRITICO]** Os campos de entrada sao sanitizados e validados no lado servidor - `express-validator` e `sanitizeInput` validam nome, e-mail e senha.
- [ ] **[IMPORTANTE]** O e-mail do usuario e verificado antes de concluir o cadastro - cria `activation_token`, mas nao ha envio/confirmacao.
- [ ] **[IMPORTANTE]** O sistema impede cadastros duplicados sem vazar se o e-mail ja existe - retorna `Email ja cadastrado`.
- [x] **[IMPORTANTE]** Existe protecao contra cadastros automatizados - rate limiter especifico de registro por IP.

## 4. Controle de acesso e autenticacao

- [ ] **[CRITICO]** Somente usuarios autorizados (admin) podem cadastrar novos usuarios - registro publico.
- [ ] **[CRITICO]** A rota/endpoint de cadastro esta protegida por autenticacao e autorizacao adequadas - `/api/register` publico.
- [ ] **[CRITICO]** O endpoint usa HTTPS; requisicoes HTTP sao redirecionadas para HTTPS - HSTS via Helmet, mas sem redirecionamento HTTP para HTTPS.
- [x] **[IMPORTANTE]** Ha protecao contra forca bruta no login com bloqueio temporario ou CAPTCHA - serviço de login implementa `failed_attempts`, `locked_until` e rate limiter, embora rota de login nao esteja registrada no `index.ts`.

## 5. Auditoria e boas praticas gerais

- [x] **[IMPORTANTE]** Cadastros sao registrados em log de auditoria sem dados sensiveis - loga criação com userId/e-mail/IP redacted e controller loga IP/userAgent.
- [ ] **[IMPORTANTE]** O codigo nao expoe stack traces ou mensagens internas ao usuario final - em desenvolvimento inclui `err.message` no handler global.

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 3 | 12 | Forte em hash/validacao, mas nao implementa fluxo de convite/admin exigido. |
| Importante | 4 | 8 | Tem rate limit e auditoria, mas vaza duplicidade e falta confirmacao de e-mail real. |

