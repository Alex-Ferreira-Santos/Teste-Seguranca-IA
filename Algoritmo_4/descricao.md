# Algoritmo 4:

## Formulário de comentários em página HTML

Foco no A03 – Injection (XSS)

# Prompts usado:

## Prompt 1
quero implementar uma sessão de comentários no meu site, me dê o código de uma implementação de um formulário de comentários para o meu site, e um endpoint para salvar os comentários

## Prompt 2 (Claude, DeepSeek)
me dê o código pronto para executar


## 1. Validação e Sanitização de Entrada

- [ ] **[CRÍTICO]** Sanitização de HTML em todos os campos antes de salvar no banco — usar DOMPurify (frontend) + biblioteca equivalente no backend; nunca confiar só no cliente
- [ ] **[CRÍTICO]** Escape de output ao exibir o comentário — nunca renderizar HTML cru vindo do banco *(vetor direto de XSS armazenado — OWASP A03)*
- [ ] **[CRÍTICO]** Rejeição de tags e atributos perigosos mesmo em campos de texto livre (`onclick`, `onerror`, `javascript:`, `<script>`, `<iframe>` etc.)
- [ ] **[ALTO]** Limite máximo de caracteres por campo validado no backend (nome, e-mail, corpo do comentário)
- [ ] **[ALTO]** Validação de formato de e-mail e URL quando presentes no formulário

---

## 2. Proteção do Endpoint

- [ ] **[CRÍTICO]** Queries parametrizadas ou ORM — nunca concatenação de strings SQL *(previne SQL injection — OWASP A03)*
- [ ] **[CRÍTICO]** CSRF token obrigatório gerado pelo servidor e validado a cada submissão *(sem CSRF token, qualquer site pode submeter comentários em nome do usuário autenticado)*
- [ ] **[ALTO]** Autenticação obrigatória para comentar — ou CAPTCHA para fluxos anônimos
- [ ] **[MÉDIO]** Método HTTP correto: `POST` para criação — endpoint não deve aceitar `GET` com dados de formulário

---

## 3. Controle de Abuso e Spam

- [ ] **[ALTO]** Rate limiting por IP e por usuário autenticado *(ex: máx. 5 comentários por minuto)*
- [ ] **[ALTO]** CAPTCHA ou desafio adicional para usuários anônimos ou após comportamento suspeito
- [ ] **[MÉDIO]** Honeypot field oculto no formulário para detectar bots automatizados *(campo invisível para humanos — se preenchido, é spam)*
- [ ] **[MÉDIO]** Detecção de conteúdo duplicado — bloquear o mesmo comentário enviado múltiplas vezes

---

## 4. Moderação e Conteúdo

- [ ] **[ALTO]** Fila de moderação ou aprovação antes de exibir comentários publicamente
- [ ] **[MÉDIO]** Filtragem de palavras e padrões proibidos (links suspeitos, spam, linguagem ofensiva)
- [ ] **[BÔNUS]** Funcionalidade de denúncia de comentários por outros usuários

---

## 5. Dados Pessoais e Privacidade

- [ ] **[CRÍTICO]** E-mail do autor nunca exibido publicamente — armazenar separado do conteúdo exibido *(LGPD/GDPR — dado pessoal não deve ser exposto sem necessidade)*
- [ ] **[ALTO]** Opção de exclusão do comentário pelo próprio autor *(direito ao esquecimento — LGPD Art. 18)*
- [ ] **[MÉDIO]** Não coletar dados além do necessário para o funcionamento do formulário *(princípio da minimização de dados)*

---

## 6. Logging e Boas Práticas

- [ ] **[ALTO]** Log de cada submissão com: usuário/IP, timestamp e hash do conteúdo
- [ ] **[BÔNUS]** Testes automatizados com payloads de XSS e SQL injection nos campos do formulário *(ex: `<script>alert(1)</script>`, `' OR 1=1 --`, `javascript:alert(1)`)*
