# Checklist - projeto_seguro

Analise baseada em `projeto_seguro/scripts/dependency-manager.js`.

## Integridade e origem das dependencias

- [x] **[Critico]** Dependencias instaladas de fontes oficiais/confiaveis. Usa npm padrao.
- [x] **[Critico]** Versoes fixadas com lockfile. Usa `npm ci`.
- [x] **[Critico]** Integridade verificada via checksum/hash. `npm ci` valida lockfile.
- [x] **[Critico]** Nao usa `curl | bash` ou `wget | sh`. Nao ha esse padrao.
- [x] **[Importante]** Dependencias transitivas auditadas. `npm audit --production`.

## Auditoria de vulnerabilidades

- [x] **[Critico]** Executa auditoria apos instalacao. Chama `npm audit --production`.
- [x] **[Critico]** Falha em vulnerabilidades criticas. `runCommand` encerra quando `npm audit` retorna erro.
- [ ] **[Importante]** CVEs sem correcao documentados. Relatorio registra saida, mas nao justificativas/prazos.
- [ ] **[Importante]** Verificacao de typosquatting. Nao implementado.

## Execucao segura do script

- [ ] **[Critico]** Nao executado como root/admin desnecessariamente. Nao valida root/admin.
- [x] **[Critico]** Interrompe em erro. `process.exit(1)` em falhas.
- [x] **[Critico]** Credenciais nao hardcoded. Nao ha credenciais.
- [ ] **[Critico]** Entradas externas validadas/sanitizadas. Comandos sao constantes, mas executados com `execSync` por string.
- [ ] **[Importante]** Valida ambiente antes de executar. Nao verifica Node, SO ou package.json.

## Atualizacoes e controle de mudanca

- [ ] **[Critico]** Atualizacoes passam por testes antes de producao. Executa `npm update` direto.
- [ ] **[Importante]** Distingue dev/staging/prod. Nao implementado.
- [ ] **[Importante]** Rollback documentado. Nao implementado.
- [ ] **[Importante]** Major versions nao atualizadas automaticamente. `npm update` respeita ranges, mas nao ha politica/revisao humana.
- [x] **[Recomendado]** Loga pacotes instalados/atualizados e versoes. Salva saida de comandos em `logs/dependency-report.txt`.

## Isolamento e ambiente

- [x] **[Critico]** Dependencias instaladas em ambiente isolado/local. Usa `node_modules` local.
- [x] **[Importante]** Dev dependencies nao instaladas em producao. Auditoria usa `--production`, mas instalacao nao usa `--omit=dev`.
- [x] **[Importante]** Script idempotente. Pula `npm ci` se `node_modules` existe, embora isso possa manter estado antigo.
- [ ] **[Recomendado]** Temporarios removidos ao final. Nao implementado.
- [ ] **[Recomendado]** Revisado com analise estatica. Nao indicado.
