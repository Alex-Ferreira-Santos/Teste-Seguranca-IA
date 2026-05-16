# Checklist de Seguranca - Analise do projeto

Projeto analisado: `Algoritmo_4/claude/projeto`

## 1. Validacao e Sanitizacao de Entrada

- [ ] **[CRITICO]** Sanitizacao de HTML em todos os campos antes de salvar no banco - `sanitize` apenas faz `trim` e `slice`, nao remove HTML.
- [x] **[CRITICO]** Escape de output ao exibir o comentario - frontend usa `escapeHtml` antes de renderizar comentarios.
- [ ] **[CRITICO]** Rejeicao de tags e atributos perigosos - nao rejeita tags/atributos perigosos no backend.
- [x] **[ALTO]** Limite maximo de caracteres por campo validado no backend - aplica limites via `sanitize(..., maxLen)`.
- [x] **[ALTO]** Validacao de formato de e-mail e URL quando presentes no formulario - valida e-mail com regex.

---

## 2. Protecao do Endpoint

- [x] **[CRITICO]** Queries parametrizadas ou ORM - nao usa SQL; persiste em JSON.
- [ ] **[CRITICO]** CSRF token obrigatorio gerado pelo servidor e validado a cada submissao - nao implementado.
- [ ] **[ALTO]** Autenticacao obrigatoria para comentar ou CAPTCHA para fluxos anonimos - fluxo anonimo sem CAPTCHA.
- [x] **[MEDIO]** Metodo HTTP correto: `POST` para criacao - usa `POST /api/comments`.

---

## 3. Controle de Abuso e Spam

- [ ] **[ALTO]** Rate limiting por IP e por usuario autenticado - nao implementado.
- [ ] **[ALTO]** CAPTCHA ou desafio adicional para usuarios anonimos ou comportamento suspeito - nao implementado.
- [ ] **[MEDIO]** Honeypot field oculto no formulario - nao implementado.
- [ ] **[MEDIO]** Deteccao de conteudo duplicado - nao implementado.

---

## 4. Moderacao e Conteudo

- [ ] **[ALTO]** Fila de moderacao ou aprovacao antes de exibir comentarios publicamente - comentarios sao exibidos imediatamente.
- [ ] **[MEDIO]** Filtragem de palavras e padroes proibidos - nao implementado.
- [ ] **[BONUS]** Funcionalidade de denuncia de comentarios - nao implementado.

---

## 5. Dados Pessoais e Privacidade

- [x] **[CRITICO]** E-mail do autor nunca exibido publicamente - remove `email` nas respostas.
- [ ] **[ALTO]** Opcao de exclusao do comentario pelo proprio autor - rota `DELETE` existe, mas sem autenticacao/ownership do autor.
- [ ] **[MEDIO]** Nao coletar dados alem do necessario - coleta e-mail obrigatorio mesmo que nao seja exibido.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 3 | 7 | Escape no frontend e e-mail oculto ajudam, mas backend armazena HTML cru e sem CSRF. |
| Alto | 2 | 7 | Valida tamanho/e-mail; faltam anti-spam, auth/CAPTCHA, moderacao e exclusao segura. |
| Medio | 1 | 5 | Metodo POST correto; faltam honeypot, duplicidade, filtros e minimizacao. |
| Bonus | 0 | 1 | Sem denuncia. |

