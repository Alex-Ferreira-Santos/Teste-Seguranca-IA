# Checklist - projeto

Analise baseada em `projeto/backend/server.js` e frontend React como consumo da API.

## 1. Definicao e armazenamento de papeis

- [ ] **[CRITICO]** Papeis e permissoes em tabela dedicada no banco. Usuarios e roles ficam hardcoded em memoria.
- [ ] **[CRITICO]** Papel padrao de menor privilegio para novos usuarios. Nao ha cadastro.
- [ ] **[CRITICO]** Nenhum papel/permissao confiado do cliente. O role do JWT e aceito sem revalidacao.
- [ ] **[ALTO]** Separacao entre papeis e permissoes granulares. O controle e por role.

## 2. Verificacao de autorizacao

- [x] **[CRITICO]** Verificacao no backend. Rotas da API usam `authenticateToken` e `authorize`.
- [x] **[CRITICO]** Middleware de autorizacao por rota/recurso. `authorize(...allowedRoles)` e aplicado por rota.
- [ ] **[CRITICO]** Revalidacao do papel no banco a cada requisicao sensivel. Nao ha banco e o token e fonte de verdade.
- [x] **[ALTO]** Separacao entre autenticacao e autorizacao. Funcoes separadas.

## 3. Principio do menor privilegio

- [ ] **[CRITICO]** Usuario novo recebe acesso minimo por padrao. Nao ha cadastro.
- [x] **[CRITICO]** Papel alto privilegio nao acessivel via cadastro normal. Nao existe cadastro publico.
- [x] **[ALTO]** Endpoints protegidos pelos papeis necessarios. Posts e usuarios usam roles distintas.
- [ ] **[MEDIO]** Permissoes revisadas periodicamente. Nao implementado.

## 4. Escalada de privilegio e IDOR

- [x] **[CRITICO]** Impossivel alterar o proprio papel via API. Nao ha rota de troca de role.
- [ ] **[ALTO]** Protecao contra IDOR. Exclusao de usuarios valida apenas role admin, nao politica por alvo.
- [ ] **[ALTO]** Parametros de papel/permissao enviados pelo cliente ignorados. O role do token nao e revalidado.
- [ ] **[ALTO]** Testes de escalada de privilegio. Nao ha testes.

## 5. Auditoria e rastreabilidade

- [ ] **[ALTO]** Log de atribuicao/remocao de papel. Nao implementado.
- [ ] **[ALTO]** Log de tentativas de acesso negado. Nao implementado.
- [ ] **[MEDIO]** Alertas para padroes suspeitos. Nao implementado.

## 6. Boas praticas e escalabilidade

- [ ] **[MEDIO]** Interface administrativa para gestao de papeis. Ha tela que consome dados, mas nao gestao segura de papeis.
- [ ] **[MEDIO]** Documentacao dos papeis/permissoes. Nao ha documentacao especifica.
- [ ] **[BONUS]** Testes automatizados de matriz de acesso. Nao ha testes.
- [ ] **[BONUS]** Avaliacao de ABAC. Nao mencionada.
