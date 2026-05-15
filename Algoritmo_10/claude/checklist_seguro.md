# Checklist - projeto_seguro

Analise baseada em `projeto_seguro/setup.ts`.

## Integridade e origem das dependencias

- [x] **[Critico]** Dependencias instaladas de fontes oficiais/confiaveis. Usa npm padrao.
- [ ] **[Critico]** Versoes fixadas com lockfile. Usa `npm ci` quando ha lockfile, mas permite fallback para `npm install`.
- [x] **[Critico]** Integridade verificada via checksum/hash. `npm ci` garante integridade quando lockfile existe.
- [x] **[Critico]** Nao usa `curl | bash` ou `wget | sh`. Nao ha esse padrao.
- [x] **[Importante]** Dependencias transitivas auditadas. `npm audit` audita arvore de dependencias.

## Auditoria de vulnerabilidades

- [x] **[Critico]** Executa auditoria apos instalacao. Chama `npm audit --audit-level=high`.
- [x] **[Critico]** Falha em vulnerabilidades criticas. Encerra se houver vulnerabilidade em nivel configurado.
- [ ] **[Importante]** CVEs sem correcao documentados. Nao ha mecanismo de excecao/justificativa.
- [ ] **[Importante]** Verificacao de typosquatting. Nao implementado.

## Execucao segura do script

- [x] **[Critico]** Nao executado como root/admin desnecessariamente. Bloqueia root fora do Windows.
- [x] **[Critico]** Interrompe em erro. `fail()` encerra com exit code 1.
- [x] **[Critico]** Credenciais nao hardcoded. Nao ha credenciais no script.
- [x] **[Critico]** Entradas externas validadas/sanitizadas. Comandos sao constantes e nao recebem argumentos externos.
- [x] **[Importante]** Valida ambiente antes de executar. Verifica root, Node, npm, package.json e lockfile.

## Atualizacoes e controle de mudanca

- [ ] **[Critico]** Atualizacoes passam por testes antes de producao. Nao executa testes.
- [ ] **[Importante]** Distingue dev/staging/prod. Nao ha comportamento por ambiente.
- [ ] **[Importante]** Rollback documentado. Apenas recomenda versionar lockfile; nao implementa rollback.
- [x] **[Importante]** Major versions nao atualizadas automaticamente. Nao faz update automatico.
- [ ] **[Recomendado]** Loga pacotes instalados/atualizados e versoes. Loga etapas, nao inventario de pacotes.

## Isolamento e ambiente

- [x] **[Critico]** Dependencias instaladas em ambiente isolado/local. Usa `node_modules` local.
- [ ] **[Importante]** Dev dependencies nao instaladas em producao. Nao usa `--production`.
- [x] **[Importante]** Script idempotente. `npm ci` e verificacoes tornam execucao repetivel quando ha lockfile.
- [ ] **[Recomendado]** Temporarios removidos ao final. Nao implementado.
- [ ] **[Recomendado]** Revisado com analise estatica. Nao indicado.
