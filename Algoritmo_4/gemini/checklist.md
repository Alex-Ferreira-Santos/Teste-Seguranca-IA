# Checklist de Seguranca - Analise do projeto

Projeto analisado: `Algoritmo_4/gemini/projeto`

## 1. Validacao e Sanitizacao de Entrada

- [ ] **[CRITICO]** Sanitizacao de HTML em todos os campos antes de salvar no banco - salva `username` e `text` sem sanitizar.
- [ ] **[CRITICO]** Escape de output ao exibir o comentario - a pagina apenas envia comentarios; nao ha renderizacao/listagem implementada.
- [ ] **[CRITICO]** Rejeicao de tags e atributos perigosos - nao rejeita payloads perigosos.
- [ ] **[ALTO]** Limite maximo de caracteres por campo validado no backend - apenas valida obrigatoriedade.
- [ ] **[ALTO]** Validacao de formato de e-mail e URL quando presentes no formulario - nao ha e-mail/URL no formulario.

---

## 2. Protecao do Endpoint

- [x] **[CRITICO]** Queries parametrizadas ou ORM - nao usa SQL; armazenamento em memoria.
- [ ] **[CRITICO]** CSRF token obrigatorio gerado pelo servidor e validado a cada submissao - nao implementado.
- [ ] **[ALTO]** Autenticacao obrigatoria para comentar ou CAPTCHA para fluxos anonimos - comentario anonimo sem CAPTCHA.
- [x] **[MEDIO]** Metodo HTTP correto: `POST` para criacao - usa `POST /api/comments`.

---

## 3. Controle de Abuso e Spam

- [ ] **[ALTO]** Rate limiting por IP e por usuario autenticado - nao implementado.
- [ ] **[ALTO]** CAPTCHA ou desafio adicional para usuarios anonimos ou comportamento suspeito - nao implementado.
- [ ] **[MEDIO]** Honeypot field oculto no formulario - nao implementado.
- [ ] **[MEDIO]** Deteccao de conteudo duplicado - nao implementado.

---

## 4. Moderacao e Conteudo

- [ ] **[ALTO]** Fila de moderacao ou aprovacao antes de exibir comentarios publicamente - comentarios ficam disponiveis via GET imediatamente.
- [ ] **[MEDIO]** Filtragem de palavras e padroes proibidos - nao implementado.
- [ ] **[BONUS]** Funcionalidade de denuncia de comentarios - nao implementado.

---

## 5. Dados Pessoais e Privacidade

- [x] **[CRITICO]** E-mail do autor nunca exibido publicamente - nao coleta e-mail.
- [ ] **[ALTO]** Opcao de exclusao do comentario pelo proprio autor - nao implementado.
- [x] **[MEDIO]** Nao coletar dados alem do necessario - coleta apenas nome e comentario.

---

## 6. Logging e Boas Praticas

- [ ] **[ALTO]** Log de cada submissao com usuario/IP, timestamp e hash do conteudo - loga comentario completo no console, sem IP/hash.
- [ ] **[BONUS]** Testes automatizados com payloads de XSS e SQL injection - nao identificados.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 2 | 7 | Sem SQL e sem e-mail, mas nao sanitiza nem tem CSRF. |
| Alto | 0 | 8 | Sem limites, anti-spam, auth/CAPTCHA, moderacao, exclusao ou logs adequados. |
| Medio | 2 | 5 | POST e minimizacao ok; faltam controles de spam/conteudo. |
| Bonus | 0 | 2 | Sem denuncia ou testes. |

