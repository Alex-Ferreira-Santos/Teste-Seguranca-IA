# Checklist - projeto

Analise baseada em `projeto/server.js`, `projeto/roles.js`, `projeto/middleware.js` e rotas auxiliares.

## 1. Definicao e armazenamento de papeis

- [ ] **[CRITICO]** Papeis e permissoes em tabela dedicada no banco. `roles.js` e hardcoded e usuarios ficam em memoria.
- [ ] **[CRITICO]** Papel padrao de menor privilegio para novos usuarios. Nao ha fluxo de cadastro.
- [ ] **[CRITICO]** Nenhum papel/permissao confiado do cliente. O papel vem do JWT e nao e revalidado em banco.
- [x] **[ALTO]** Separacao entre papeis e permissoes granulares. `ROLES` mapeia papeis para permissoes.

## 2. Verificacao de autorizacao

- [x] **[CRITICO]** Verificacao no backend. As rotas usam `authenticate` e `authorize`.
- [x] **[CRITICO]** Middleware de autorizacao por rota/recurso. `authorize(permission)` e reutilizado.
- [ ] **[CRITICO]** Revalidacao do papel no banco a cada requisicao sensivel. Nao ha banco e o JWT e fonte de verdade.
- [x] **[ALTO]** Separacao entre autenticacao e autorizacao. Middlewares distintos no mesmo modulo.

## 3. Principio do menor privilegio

- [ ] **[CRITICO]** Usuario novo recebe acesso minimo por padrao. Nao ha cadastro.
- [x] **[CRITICO]** Papel alto privilegio nao acessivel via cadastro normal. Nao existe cadastro publico.
- [x] **[ALTO]** Endpoints protegidos pelos papeis/permissoes necessarios. Posts, usuarios e relatorios exigem permissoes.
- [ ] **[MEDIO]** Permissoes revisadas periodicamente. Nao implementado.

## 4. Escalada de privilegio e IDOR

- [x] **[CRITICO]** Impossivel alterar o proprio papel via API. Nao existe rota de alteracao de papel.
- [ ] **[ALTO]** Protecao contra IDOR. Edicao de posts nao valida propriedade do autor.
- [ ] **[ALTO]** Parametros de papel/permissao enviados pelo cliente ignorados. O papel do JWT e usado sem revalidacao.
- [ ] **[ALTO]** Testes de escalada de privilegio. Nao ha testes.

## 5. Auditoria e rastreabilidade

- [ ] **[ALTO]** Log de atribuicao/remocao de papel. Nao ha auditoria.
- [ ] **[ALTO]** Log de tentativas de acesso negado. 403 retorna detalhes, mas nao registra evento.
- [ ] **[MEDIO]** Alertas para padroes suspeitos. Nao implementado.

## 6. Boas praticas e escalabilidade

- [ ] **[MEDIO]** Interface administrativa para gestao de papeis. Nao implementada.
- [x] **[MEDIO]** Documentacao dos papeis/permissoes. Ha README com usuarios e papeis de exemplo.
- [ ] **[BONUS]** Testes automatizados de matriz de acesso. Nao ha testes.
- [ ] **[BONUS]** Avaliacao de ABAC. Nao mencionada.
