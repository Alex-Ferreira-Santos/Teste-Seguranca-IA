# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_4/claude/projeto_seguro`

## 1. Validacao e Sanitizacao de Entrada

- [x] **[CRITICO]** Sanitizacao de HTML em todos os campos antes de salvar no banco - usa DOMPurify no backend com `ALLOWED_TAGS` e `ALLOWED_ATTR` vazios.
- [x] **[CRITICO]** Escape de output ao exibir o comentario - frontend usa DOMPurify e `textContent`; API retorna comentarios aprovados ja sanitizados.
- [x] **[CRITICO]** Rejeicao de tags e atributos perigosos - schema restringe nome e DOMPurify remove HTML do corpo.
- [x] **[ALTO]** Limite maximo de caracteres por campo validado no backend - Zod limita nome, e-mail, corpo e `page_id`.
- [x] **[ALTO]** Validacao de formato de e-mail e URL quando presentes no formulario - Zod usa `.email()`.

---

## 2. Protecao do Endpoint

- [x] **[CRITICO]** Queries parametrizadas ou ORM - armazenamento em memoria, sem SQL.
- [x] **[CRITICO]** CSRF token obrigatorio gerado pelo servidor e validado a cada submissao - usa `csurf` e endpoint `/api/csrf-token`.
- [ ] **[ALTO]** Autenticacao obrigatoria para comentar ou CAPTCHA para fluxos anonimos - comentario anonimo sem CAPTCHA; rotas admin tambem nao tem auth.
- [x] **[MEDIO]** Metodo HTTP correto: `POST` para criacao - cria comentarios em `POST /api/comments`.

---

## 3. Controle de Abuso e Spam

- [ ] **[ALTO]** Rate limiting por IP e por usuario autenticado - rate limit e por IP hash, nao por usuario.
- [ ] **[ALTO]** CAPTCHA ou desafio adicional para usuarios anonimos ou comportamento suspeito - nao implementado.
- [x] **[MEDIO]** Honeypot field oculto no formulario - campo `website` e validado no backend.
- [ ] **[MEDIO]** Deteccao de conteudo duplicado - nao implementado.

---

## 4. Moderacao e Conteudo

- [x] **[ALTO]** Fila de moderacao ou aprovacao antes de exibir comentarios publicamente - insere `approved: false` e lista apenas aprovados.
- [ ] **[MEDIO]** Filtragem de palavras e padroes proibidos - nao implementado.
- [ ] **[BONUS]** Funcionalidade de denuncia de comentarios - nao implementado.

---

## 5. Dados Pessoais e Privacidade

- [x] **[CRITICO]** E-mail do autor nunca exibido publicamente - `findApproved` e `findPending` removem `author_email`.
- [ ] **[ALTO]** Opcao de exclusao do comentario pelo proprio autor - nao implementado.
- [ ] **[MEDIO]** Nao coletar dados alem do necessario - e-mail e obrigatorio e IP hash e armazenado.

---

## 6. Logging e Boas Praticas

- [ ] **[ALTO]** Log de cada submissao com usuario/IP, timestamp e hash do conteudo - armazena IP hash no comentario, mas nao loga hash do conteudo/timestamp de submissao em log.
- [ ] **[BONUS]** Testes automatizados com payloads de XSS e SQL injection - nao identificados.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 7 | 7 | Cobre XSS, CSRF, privacidade de e-mail e ausencia de SQL. |
| Alto | 3 | 8 | Valida entrada e modera, mas falta auth/CAPTCHA, rate limit por usuario, exclusao e logging completo. |
| Medio | 2 | 5 | POST e honeypot existem; faltam duplicidade, filtros e minimizacao. |
| Bonus | 0 | 2 | Sem denuncia ou testes. |

