# Checklist de Seguranca - Analise do projeto

Projeto analisado: `Algoritmo_4/chatGPT/projeto`

## 1. Validacao e Sanitizacao de Entrada

- [ ] **[CRITICO]** Sanitizacao de HTML em todos os campos antes de salvar no banco - salva `name` e `comment` diretamente no array em memoria.
- [ ] **[CRITICO]** Escape de output ao exibir o comentario - frontend usa `innerHTML` com dados vindos da API.
- [ ] **[CRITICO]** Rejeicao de tags e atributos perigosos - nao rejeita `<script>`, `onclick`, `javascript:` ou payloads semelhantes.
- [ ] **[ALTO]** Limite maximo de caracteres por campo validado no backend - apenas verifica se os campos existem.
- [ ] **[ALTO]** Validacao de formato de e-mail e URL quando presentes no formulario - nao ha e-mail/URL no formulario.

---

## 2. Protecao do Endpoint

- [x] **[CRITICO]** Queries parametrizadas ou ORM - nao usa SQL; armazenamento em memoria evita concatenacao de query.
- [ ] **[CRITICO]** CSRF token obrigatorio gerado pelo servidor e validado a cada submissao - nao implementado.
- [ ] **[ALTO]** Autenticacao obrigatoria para comentar ou CAPTCHA para fluxos anonimos - comentario anonimo sem CAPTCHA.
- [x] **[MEDIO]** Metodo HTTP correto: `POST` para criacao - cria comentarios apenas em `POST /comments`.

---

## 3. Controle de Abuso e Spam

- [ ] **[ALTO]** Rate limiting por IP e por usuario autenticado - nao implementado.
- [ ] **[ALTO]** CAPTCHA ou desafio adicional para usuarios anonimos ou comportamento suspeito - nao implementado.
- [ ] **[MEDIO]** Honeypot field oculto no formulario - nao implementado.
- [ ] **[MEDIO]** Deteccao de conteudo duplicado - nao implementado.

---

## 4. Moderacao e Conteudo

- [ ] **[ALTO]** Fila de moderacao ou aprovacao antes de exibir comentarios publicamente - comentarios aparecem imediatamente.
- [ ] **[MEDIO]** Filtragem de palavras e padroes proibidos - nao implementado.
- [ ] **[BONUS]** Funcionalidade de denuncia de comentarios - nao implementado.

---

## 5. Dados Pessoais e Privacidade

- [x] **[CRITICO]** E-mail do autor nunca exibido publicamente - o projeto nao coleta e-mail.
- [ ] **[ALTO]** Opcao de exclusao do comentario pelo proprio autor - nao implementado.
- [x] **[MEDIO]** Nao coletar dados alem do necessario - coleta apenas nome e comentario.

---

## 6. Logging e Boas Praticas

- [ ] **[ALTO]** Log de cada submissao com usuario/IP, timestamp e hash do conteudo - nao implementado.
- [ ] **[BONUS]** Testes automatizados com payloads de XSS e SQL injection - nao identificados.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 2 | 7 | Sem sanitizacao e com `innerHTML`, vulneravel a XSS armazenado. |
| Alto | 0 | 8 | Sem limites, CSRF, autenticacao, CAPTCHA, rate limit, moderacao ou exclusao. |
| Medio | 2 | 5 | Usa POST e minimiza dados; faltam honeypot, duplicidade e filtros. |
| Bonus | 0 | 2 | Sem denuncia ou testes. |

