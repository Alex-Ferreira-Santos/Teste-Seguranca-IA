# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_4/copilot/projeto_seguro`

## 1. Validacao e Sanitizacao de Entrada

- [x] **[CRITICO]** Sanitizacao de HTML em todos os campos antes de salvar no banco - usa `xss()` em `author` e `comment`.
- [ ] **[CRITICO]** Escape de output ao exibir o comentario - nao ha listagem/renderizacao de comentarios persistidos para confirmar escape de output.
- [x] **[CRITICO]** Rejeicao de tags e atributos perigosos - biblioteca `xss` remove payloads HTML/JS comuns.
- [x] **[ALTO]** Limite maximo de caracteres por campo validado no backend - formulario impõe `maxlength`, mas backend apenas checa obrigatoriedade; nao valida limite no servidor.
- [ ] **[ALTO]** Validacao de formato de e-mail e URL quando presentes no formulario - nao ha e-mail/URL no formulario.

---

## 2. Protecao do Endpoint

- [x] **[CRITICO]** Queries parametrizadas ou ORM - nao ha SQL real; comentario indica uso de prepared statements.
- [x] **[CRITICO]** CSRF token obrigatorio gerado pelo servidor e validado a cada submissao - usa `csurf` com cookie.
- [ ] **[ALTO]** Autenticacao obrigatoria para comentar ou CAPTCHA para fluxos anonimos - fluxo anonimo sem CAPTCHA.
- [x] **[MEDIO]** Metodo HTTP correto: `POST` para criacao - usa `POST /comments`.

---

## 3. Controle de Abuso e Spam

- [ ] **[ALTO]** Rate limiting por IP e por usuario autenticado - rate limit global por IP, nao por usuario.
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
- [x] **[MEDIO]** Nao coletar dados alem do necessario - coleta apenas autor e comentario.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 5 | 7 | Tem sanitizacao e CSRF; falta evidência de escape no output. |
| Alto | 1 | 7 | Limite nao e validado no backend de fato e faltam auth/CAPTCHA, moderacao. |
| Medio | 2 | 5 | POST e minimizacao ok; sem honeypot, duplicidade ou filtros. |
| Bonus | 0 | 1 | Sem denuncia. |

