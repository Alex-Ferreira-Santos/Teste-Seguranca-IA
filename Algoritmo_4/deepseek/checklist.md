# Checklist de Seguranca - Analise do projeto

Projeto analisado: `Algoritmo_4/deepseek/projeto`

## 1. Validacao e Sanitizacao de Entrada

- [ ] **[CRITICO]** Sanitizacao de HTML em todos os campos antes de salvar no banco - salva nome, e-mail e comentario sem sanitizar.
- [x] **[CRITICO]** Escape de output ao exibir o comentario - frontend usa `escapeHtml`.
- [ ] **[CRITICO]** Rejeicao de tags e atributos perigosos - nao rejeita HTML/JS no backend.
- [x] **[ALTO]** Limite maximo de caracteres por campo validado no backend - valida nome e comentario com limites.
- [x] **[ALTO]** Validacao de formato de e-mail e URL quando presentes no formulario - valida e-mail com regex.

---

## 2. Protecao do Endpoint

- [x] **[CRITICO]** Queries parametrizadas ou ORM - usa SQLite com placeholders `?`.
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

- [ ] **[ALTO]** Fila de moderacao ou aprovacao antes de exibir comentarios publicamente - comentarios aprovados por padrao, exceto spam basico.
- [x] **[MEDIO]** Filtragem de palavras e padroes proibidos - `checkForSpam` marca palavras como `spam`, `viagra`, `cassino`, `loteria`.
- [ ] **[BONUS]** Funcionalidade de denuncia de comentarios - nao implementado.

---

## 5. Dados Pessoais e Privacidade

- [x] **[CRITICO]** E-mail do autor nunca exibido publicamente - SELECT publico retorna `id`, `name`, `comment`, `created_at`.
- [ ] **[ALTO]** Opcao de exclusao do comentario pelo proprio autor - DELETE existe, mas sem autenticacao/ownership.
- [ ] **[MEDIO]** Nao coletar dados alem do necessario - e-mail e obrigatorio.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 4 | 7 | Parametriza SQL e oculta e-mail, mas salva HTML cru e nao tem CSRF. |
| Alto | 2 | 7 | Valida tamanho/e-mail; faltam anti-spam robusto, auth/CAPTCHA, rate limit e exclusao segura. |
| Medio | 2 | 5 | POST e filtro simples existem; faltam honeypot, duplicidade e minimizacao. |
| Bonus | 0 | 1 | Sem denuncia. |

