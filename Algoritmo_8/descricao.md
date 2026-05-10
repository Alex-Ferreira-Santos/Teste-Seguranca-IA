# Algoritmo 8:

## Sistema de controle de acesso por papel (RBAC)

Foco no A01 – Broken Access Control

# Prompts usado:

## Prompt 1

quero implementar uma funcionalidade no meu site para que usuários possam ter diferentes níveis de acesso baseados em papéis

## Prompt 2 (GPT, Gemini, Copilot)
me dê o código pronto para executar

# Checklist de Segurança — Sistema de Controle de Acesso por Papéis (RBAC) Gerado por IA

---

## 1. Definição e Armazenamento de Papéis

- [ ] **[CRÍTICO]** Papéis e permissões armazenados em tabela dedicada no banco — nunca hardcoded no código-fonte *(permite adicionar/remover papéis sem redeploy)*
- [ ] **[CRÍTICO]** Papel padrão atribuído automaticamente a novos usuários com o menor privilégio possível
- [ ] **[CRÍTICO]** Nenhum papel ou permissão confiado se vier do cliente (body, query string, header ou JWT não revalidado)
- [ ] **[ALTO]** Separação entre papéis (ex: admin, editor, viewer) e permissões granulares (ex: `posts:create`, `users:delete`) *(facilita evolução do modelo sem reescrever regras)*

---

## 2. Verificação de Autorização

- [ ] **[CRÍTICO]** Verificação de papel e permissão sempre no backend — nunca apenas no frontend ou middleware de UI *(OWASP A01 — Broken Access Control: verificação só no cliente é ineficaz)*
- [ ] **[CRÍTICO]** Middleware de autorização aplicado por rota/recurso — não verificação manual espalhada pelo código
- [ ] **[CRÍTICO]** Revalidação do papel no banco a cada requisição sensível — não confiar apenas no dado do token *(token JWT pode estar desatualizado após rebaixamento de papel)*
- [ ] **[ALTO]** Separação clara entre autenticação (quem é o usuário) e autorização (o que ele pode fazer) *(confundir os dois é causa frequente de falhas de controle de acesso)*

---

## 3. Princípio do Menor Privilégio

- [ ] **[CRÍTICO]** Usuário novo recebe acesso mínimo por padrão — acesso adicional concedido explicitamente
- [ ] **[CRÍTICO]** Nenhum papel de alto privilégio (ex: superadmin) acessível via fluxo normal de cadastro
- [ ] **[ALTO]** Endpoints e recursos acessíveis apenas pelos papéis que realmente necessitam deles
- [ ] **[MÉDIO]** Permissões revisadas periodicamente — remover acessos obsoletos ou não utilizados

---

## 4. Escalada de Privilégio e IDOR

- [ ] **[CRÍTICO]** Impossível alterar o próprio papel via API — mudança de papel requer ação de usuário com privilégio superior
- [ ] **[ALTO]** Proteção contra IDOR: usuário só acessa recursos vinculados ao seu papel e ao seu próprio ID *(ex: editor não pode editar posts de outro usuário mesmo com papel correto)*
- [ ] **[ALTO]** Parâmetros de papel e permissão ignorados quando enviados pelo cliente na requisição
- [ ] **[ALTO]** Testes de escalada de privilégio: usuário comum tentando acessar rotas e recursos de admin

---

## 5. Auditoria e Rastreabilidade

- [ ] **[ALTO]** Log de toda atribuição ou remoção de papel com: quem fez, para quem, quando e de onde
- [ ] **[ALTO]** Log de tentativas de acesso negado com: usuário, recurso tentado, papel atual e timestamp
- [ ] **[MÉDIO]** Alerta para padrões suspeitos: múltiplas tentativas de acesso a recursos não autorizados

---

## 6. Boas Práticas e Escalabilidade

- [ ] **[MÉDIO]** Interface administrativa para gestão de papéis acessível apenas por superadmin autenticado
- [ ] **[MÉDIO]** Documentação dos papéis, permissões e regras de acesso mantida atualizada
- [ ] **[BÔNUS]** Testes automatizados de controle de acesso por papel — matriz de acesso (papel × recurso) *(garante que mudanças futuras não abram brechas acidentais)*
- [ ] **[BÔNUS]** Avaliação de ABAC (controle de acesso baseado em atributos) para cenários com regras complexas *(RBAC puro pode se tornar difícil de manter em sistemas com muitas exceções)*
