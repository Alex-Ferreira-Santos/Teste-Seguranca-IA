# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_4/deepseek/projeto_seguro`

## 1. Validacao e Sanitizacao de Entrada

- [x] **[CRITICO]** Sanitizacao de HTML em todos os campos antes de salvar no banco - middleware `preventXSS` aplica `xss` em strings do body.
- [x] **[CRITICO]** Escape de output ao exibir o comentario - frontend usa `escapeHtml`; backend lista apenas campos seguros.
- [x] **[CRITICO]** Rejeicao de tags e atributos perigosos - valida comentario contra caracteres `<>{}` e remove tags com `xss`.
- [x] **[ALTO]** Limite maximo de caracteres por campo validado no backend - valida nome, e-mail e conteudo com limites.
- [x] **[ALTO]** Validacao de formato de e-mail e URL quando presentes no formulario - usa `isEmail()`.

---

## 2. Protecao do Endpoint

- [x] **[CRITICO]** Queries parametrizadas ou ORM - usa SQLite com placeholders.
- [x] **[CRITICO]** CSRF token obrigatorio gerado pelo servidor e validado a cada submissao - middleware valida token one-time em tabela `csrf_tokens`.
- [ ] **[ALTO]** Autenticacao obrigatoria para comentar ou CAPTCHA para fluxos anonimos - fluxo anonimo sem CAPTCHA.
- [x] **[MEDIO]** Metodo HTTP correto: `POST` para criacao - usa `POST /api/comments`.

---

## 3. Controle de Abuso e Spam

- [ ] **[ALTO]** Rate limiting por IP e por usuario autenticado - limites sao por IP, nao por usuario.
- [ ] **[ALTO]** CAPTCHA ou desafio adicional para usuarios anonimos ou comportamento suspeito - nao implementado.
- [ ] **[MEDIO]** Honeypot field oculto no formulario - nao implementado.
- [x] **[MEDIO]** Deteccao de conteudo duplicado - nao detecta duplicidade exata, mas bloqueia novo comentario do mesmo IP em menos de 2 minutos.

---

## 4. Moderacao e Conteudo

- [x] **[ALTO]** Fila de moderacao ou aprovacao antes de exibir comentarios publicamente - insere com status `pending` e lista apenas `approved`.
- [ ] **[MEDIO]** Filtragem de palavras e padroes proibidos - nao implementado alem da restricao de caracteres.
- [ ] **[BONUS]** Funcionalidade de denuncia de comentarios - nao implementado.

---

## 5. Dados Pessoais e Privacidade

- [x] **[CRITICO]** E-mail do autor nunca exibido publicamente - GET seleciona apenas `id`, `name`, `content`, `created_at`.
- [ ] **[ALTO]** Opcao de exclusao do comentario pelo proprio autor - nao implementado.
- [ ] **[MEDIO]** Nao coletar dados alem do necessario - armazena e-mail, IP e user-agent.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 7 | 7 | Cobre XSS, CSRF, SQL parametrizado e privacidade de e-mail. |
| Alto | 4 | 7 | Valida entrada e modera, mas falta CAPTCHA/auth, rate limit por usuario, exclusao segura. |
| Medio | 2 | 5 | POST e bloqueio temporal existem; faltam honeypot, filtro de palavras e minimizacao. |
| Bonus | 0 | 1 | Sem denuncia. |

