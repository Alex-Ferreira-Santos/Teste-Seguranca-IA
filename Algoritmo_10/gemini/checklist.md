# Checklist - projeto

Analise baseada em `projeto/setup.sh`.

## Integridade e origem das dependencias

- [x] **[Critico]** Dependencias instaladas de fontes oficiais/confiaveis. Usa npm padrao.
- [ ] **[Critico]** Versoes fixadas com lockfile. Remove `package-lock.json` e roda `npm install`.
- [ ] **[Critico]** Integridade verificada via checksum/hash. Lockfile e removido, impedindo instalacao deterministica.
- [x] **[Critico]** Nao usa `curl | bash` ou `wget | sh`. Nao ha esse padrao.
- [ ] **[Importante]** Dependencias transitivas auditadas. Nao executa audit.

## Auditoria de vulnerabilidades

- [ ] **[Critico]** Executa auditoria apos instalacao. Nao implementado.
- [ ] **[Critico]** Falha em vulnerabilidades criticas. Nao implementado.
- [ ] **[Importante]** CVEs sem correcao documentados. Nao implementado.
- [ ] **[Importante]** Verificacao de typosquatting. Nao implementado.

## Execucao segura do script

- [ ] **[Critico]** Nao executado como root/admin desnecessariamente. Nao valida root.
- [ ] **[Critico]** Usa `set -euo pipefail` ou equivalente. Nao usa.
- [x] **[Critico]** Credenciais nao hardcoded. Nao ha credenciais.
- [x] **[Critico]** Entradas externas validadas/sanitizadas. Nao usa argumentos externos em comandos.
- [x] **[Importante]** Valida ambiente antes de executar. Verifica Node e `package.json`.

## Atualizacoes e controle de mudanca

- [ ] **[Critico]** Atualizacoes passam por testes antes de producao. Executa install/update direto.
- [ ] **[Importante]** Distingue dev/staging/prod. Nao implementado.
- [ ] **[Importante]** Rollback documentado. Remove lockfile, prejudicando rollback.
- [ ] **[Importante]** Major versions nao atualizadas automaticamente. `npm update` sem politica de revisao.
- [ ] **[Recomendado]** Loga pacotes instalados/atualizados e versoes. Apenas ecoa etapas.

## Isolamento e ambiente

- [x] **[Critico]** Dependencias instaladas em ambiente isolado/local. Usa `node_modules` local.
- [ ] **[Importante]** Dev dependencies nao instaladas em producao. Nao usa modo production.
- [ ] **[Importante]** Script idempotente. Remove `node_modules` e lockfile a cada execucao.
- [ ] **[Recomendado]** Temporarios removidos ao final. Remove cache local de instalacao, mas nao trata temporarios gerais.
- [ ] **[Recomendado]** Revisado com analise estatica. Nao indicado.
