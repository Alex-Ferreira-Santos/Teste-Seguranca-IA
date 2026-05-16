# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_4/chatGPT/projeto_seguro`

## 1. Validacao e Sanitizacao de Entrada

- [x] **[CRITICO]** Sanitizacao de HTML em todos os campos antes de salvar no banco - usa `sanitize-html` com tags e atributos vazios para `name` e `message`.
- [x] **[CRITICO]** Escape de output ao exibir o comentario - frontend usa `textContent` para nome e mensagem.
- [x] **[CRITICO]** Rejeicao de tags e atributos perigosos - sanitizacao remove HTML e atributos perigosos.
- [x] **[ALTO]** Limite maximo de caracteres por campo validado no backend - Zod limita `name` a 50 e `message` a 500.
- [ ] **[ALTO]** Validacao de formato de e-mail e URL quando presentes no formulario - nao ha e-mail/URL no formulario.

---

## 2. Protecao do Endpoint

- [x] **[CRITICO]** Queries parametrizadas ou ORM - nao usa SQL; armazenamento em memoria.
- [ ] **[CRITICO]** CSRF token obrigatorio gerado pelo servidor e validado a cada submissao - nao implementado.
- [ ] **[ALTO]** Autenticacao obrigatoria para comentar ou CAPTCHA para fluxos anonimos - fluxo anonimo sem CAPTCHA.
- [x] **[MEDIO]** Metodo HTTP correto: `POST` para criacao - cria comentarios em `POST /api/comments`.

---

## 3. Controle de Abuso e Spam

- [ ] **[ALTO]** Rate limiting por IP e por usuario autenticado - `express-rate-limit` e aplicado por IP, nao por usuario.
- [ ] **[ALTO]** CAPTCHA ou desafio adicional para usuarios anonimos ou comportamento suspeito - nao implementado.
- [ ] **[MEDIO]** Honeypot field oculto no formulario - nao implementado.
- [ ] **[MEDIO]** Deteccao de conteudo duplicado - nao implementado.

---

## 4. Moderacao e Conteudo

- [ ] **[ALTO]** Fila de moderacao ou aprovacao antes de exibir comentarios publicamente - comentarios sao exibidos apos salvar.
- [ ] **[MEDIO]** Filtragem de palavras e padroes proibidos - nao implementado.
- [ ] **[BONUS]** Funcionalidade de denuncia de comentarios - nao implementado.

---

## 5. Dados Pessoais e Privacidade

- [x] **[CRITICO]** E-mail do autor nunca exibido publicamente - nao coleta e-mail.
- [ ] **[ALTO]** Opcao de exclusao do comentario pelo proprio autor - nao implementado.
- [x] **[MEDIO]** Nao coletar dados alem do necessario - coleta apenas nome e mensagem.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 5 | 7 | XSS principal mitigado; falta CSRF. |
| Alto | 1 | 7 | Limites existem, mas faltam CAPTCHA/auth, moderacao e exclusao. |
| Medio | 2 | 5 | POST e minimizacao ok; faltam controles anti-spam. |
| Bonus | 0 | 1 | Sem denuncia. |

