# Checklist de Seguranca - Analise do projeto

Projeto analisado: `Algoritmo_5/copilot/projeto`

## 1. Geracao e armazenamento de senha

- [ ] **[CRITICO]** A senha temporaria e gerada com entropia suficiente - usuario envia a propria senha; nao ha senha temporaria.
- [x] **[CRITICO]** A senha nunca e armazenada em texto plano - salva hash no MongoDB.
- [x] **[CRITICO]** O algoritmo de hash utilizado e bcrypt, Argon2 ou scrypt - usa bcrypt com custo 10.
- [ ] **[CRITICO]** O usuario e obrigado a trocar a senha no primeiro acesso - senha e definida no cadastro.
- [ ] **[CRITICO]** Senhas temporarias tem prazo de expiracao e sao invalidadas apos o uso - nao ha token temporario; ativacao por ID nao expira.

## 2. Transmissao da senha ao usuario

- [ ] **[CRITICO]** A senha e enviada apenas por canal seguro - nao envia senha, mas link de ativacao usa ID previsivel em URL HTTP local.
- [ ] **[CRITICO]** O sistema prefere enviar um link de definicao de senha - envia link de ativacao, mas a senha ja foi definida no cadastro.
- [ ] **[IMPORTANTE]** A senha ou link nao e registrado em logs - nao ha log explicito, mas credenciais SMTP estao hardcoded como exemplo.
- [ ] **[CRITICO]** O link de definicao de senha e de uso unico e invalidado apos utilizacao ou expiracao - `/activate/:id` pode ser reutilizado e nao expira.

## 3. Cadastro e validacao de dados

- [ ] **[CRITICO]** Os campos de entrada sao sanitizados e validados no lado servidor - nao valida e-mail/senha alem do fluxo do banco.
- [ ] **[IMPORTANTE]** O e-mail do usuario e verificado antes de concluir o cadastro - existe ativacao por e-mail, mas baseada em ID sem token seguro.
- [ ] **[IMPORTANTE]** O sistema impede cadastros duplicados sem vazar se o e-mail ja existe - unique no schema, mas erro interno pode expor mensagem.
- [ ] **[IMPORTANTE]** Existe protecao contra cadastros automatizados - nao ha rate limit/CAPTCHA.

## 4. Controle de acesso e autenticacao

- [ ] **[CRITICO]** Somente usuarios autorizados (admin) podem cadastrar novos usuarios - registro publico.
- [ ] **[CRITICO]** A rota/endpoint de cadastro esta protegida por autenticacao e autorizacao adequadas - `/register` publico.
- [ ] **[CRITICO]** O endpoint usa HTTPS; requisicoes HTTP sao redirecionadas para HTTPS - nao implementado.
- [ ] **[IMPORTANTE]** Ha protecao contra forca bruta no login - nao ha login/rate limit.

## 5. Auditoria e boas praticas gerais

- [ ] **[IMPORTANTE]** Cadastros sao registrados em log de auditoria sem dados sensiveis - nao implementado.
- [ ] **[IMPORTANTE]** O codigo nao expoe stack traces ou mensagens internas ao usuario final - retorna `error.message` em erros de cadastro/ativacao.
- [ ] **[RECOMENDADO]** Dependencias e bibliotecas estao atualizadas e sem CVEs conhecidos - nao foi executada auditoria.
- [ ] **[RECOMENDADO]** A funcionalidade passou por code review ou analise de seguranca - nao ha evidencia.

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 2 | 12 | Hash existe, mas ativacao por ID e registro publico deixam o fluxo fraco. |
| Importante | 0 | 8 | Sem anti-enumeracao, rate limit, auditoria ou tratamento seguro de erros. |
| Recomendado | 0 | 2 | Sem evidencia de auditoria de dependencias ou review. |

