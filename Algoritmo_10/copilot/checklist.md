# Checklist - projeto

Analise baseada em `projeto/setup.js`.

## Integridade e origem das dependencias

- [x] **[Critico]** Dependencias instaladas de fontes oficiais/confiaveis. Usa npm.
- [ ] **[Critico]** Versoes fixadas com lockfile. Usa `npm install` e `npm update`.
- [ ] **[Critico]** Integridade verificada via checksum/hash. Nao usa `npm ci`.
- [x] **[Critico]** Nao usa `curl | bash` ou `wget | sh`. Nao ha esse padrao.
- [ ] **[Importante]** Dependencias transitivas auditadas. Nao executa audit.

## Auditoria de vulnerabilidades

- [ ] **[Critico]** Executa auditoria apos instalacao. Nao implementado.
- [ ] **[Critico]** Falha em vulnerabilidades criticas. Nao implementado.
- [ ] **[Importante]** CVEs sem correcao documentados. Nao implementado.
- [ ] **[Importante]** Verificacao de typosquatting. Nao implementado.

## Execucao segura do script

- [ ] **[Critico]** Nao executado como root/admin desnecessariamente. Instala `npm` globalmente com `npm install -g npm`.
- [x] **[Critico]** Interrompe em erro. `runCommand` encerra com exit code 1.
- [x] **[Critico]** Credenciais nao hardcoded. Nao ha credenciais.
- [x] **[Critico]** Entradas externas validadas/sanitizadas. Nao usa entradas externas.
- [ ] **[Importante]** Valida ambiente antes de executar. Nao verifica Node, SO, permissoes ou package.json.

## Atualizacoes e controle de mudanca

- [ ] **[Critico]** Atualizacoes passam por testes antes de producao. Atualiza direto.
- [ ] **[Importante]** Distingue dev/staging/prod. Nao implementado.
- [ ] **[Importante]** Rollback documentado. Nao implementado.
- [ ] **[Importante]** Major versions nao atualizadas automaticamente. Atualiza npm global para ultima versao.
- [ ] **[Recomendado]** Loga pacotes instalados/atualizados e versoes. Loga comandos, nao versoes.

## Isolamento e ambiente

- [ ] **[Critico]** Dependencias instaladas em ambiente isolado/local. Projeto usa local, mas tambem instala npm global.
- [ ] **[Importante]** Dev dependencies nao instaladas em producao. Nao usa modo production.
- [x] **[Importante]** Script idempotente. Pode ser reexecutado, embora `npm update` altere estado.
- [ ] **[Recomendado]** Temporarios removidos ao final. Nao implementado.
- [ ] **[Recomendado]** Revisado com analise estatica. Nao indicado.
