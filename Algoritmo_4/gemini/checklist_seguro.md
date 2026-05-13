# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_4/gemini/projeto_seguro`

## 1. Validacao e Sanitizacao de Entrada

- [x] **[CRITICO]** Sanitizacao de HTML em todos os campos antes de salvar no banco - usa `escape()` para username e DOMPurify para content antes do salvamento simulado.
- [ ] **[CRITICO]** Escape de output ao exibir o comentario - nao ha endpoint/listagem de comentarios para verificar escape de output.
- [x] **[CRITICO]** Rejeicao de tags e atributos perigosos - DOMPurify remove scripts/event handlers do conteudo.
- [x] **[ALTO]** Limite maximo de caracteres por campo validado no backend - valida `username` 2-50 e `content` 1-500.
- [ ] **[ALTO]** Validacao de formato de e-mail e URL quando presentes no formulario - nao ha e-mail/URL no formulario.

---

## 2. Protecao do Endpoint

- [x] **[CRITICO]** Queries parametrizadas ou ORM - nao ha SQL real; comentario orienta usar ORM/prepared statements.
- [ ] **[CRITICO]** CSRF token obrigatorio gerado pelo servidor e validado a cada submissao - nao implementado.
- [ ] **[ALTO]** Autenticacao obrigatoria para comentar ou CAPTCHA para fluxos anonimos - fluxo anonimo sem CAPTCHA.
- [x] **[MEDIO]** Metodo HTTP correto: `POST` para criacao - usa `POST /api/comments`.

---

## 3. Controle de Abuso e Spam

- [ ] **[ALTO]** Rate limiting por IP e por usuario autenticado - rate limit por IP, nao por usuario.
- [ ] **[ALTO]** CAPTCHA ou desafio adicional para usuarios anonimos ou comportamento suspeito - nao implementado.
- [ ] **[MEDIO]** Honeypot field oculto no formulario - nao implementado.
- [ ] **[MEDIO]** Deteccao de conteudo duplicado - nao implementado.

---

## 4. Moderacao e Conteudo

- [ ] **[ALTO]** Fila de moderacao ou aprovacao antes de exibir comentarios publicamente - nao implementado.
- [ ] **[MEDIO]** Filtragem de palavras e padroes proibidos - nao implementado.
- [ ] **[BONUS]** Funcionalidade de denuncia de comentarios - nao implementado.

---

## 5. Dados Pessoais e Privacidade

- [x] **[CRITICO]** E-mail do autor nunca exibido publicamente - nao coleta e-mail.
- [ ] **[ALTO]** Opcao de exclusao do comentario pelo proprio autor - nao implementado.
- [x] **[MEDIO]** Nao coletar dados alem do necessario - coleta apenas username e comentario.

---

## 6. Logging e Boas Praticas

- [ ] **[ALTO]** Log de cada submissao com usuario/IP, timestamp e hash do conteudo - loga autor e conteudo sanitizado, sem IP/hash.
- [ ] **[BONUS]** Testes automatizados com payloads de XSS e SQL injection - nao identificados.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 4 | 7 | Sanitiza entrada e evita SQL real, mas falta CSRF e renderizacao segura demonstrada. |
| Alto | 1 | 8 | Valida tamanho; faltam auth/CAPTCHA, rate limit por usuario, moderacao, exclusao e logging. |
| Medio | 2 | 5 | POST e minimizacao ok; sem honeypot, duplicidade ou filtros. |
| Bonus | 0 | 2 | Sem denuncia ou testes. |

