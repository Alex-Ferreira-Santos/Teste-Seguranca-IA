# Checklist - projeto_seguro

Analise baseada em `projeto_seguro/setup-project.ts` e `package.json`.

## Integridade e origem das dependencias

- [x] **[Critico]** Dependencias instaladas de fontes oficiais/confiaveis. Usa npm padrao.
- [ ] **[Critico]** Versoes fixadas com lockfile. Exige `npm ci`, mas se nao houver lockfile apenas avisa e depois falhara; `package.json` usa ranges em devDependencies.
- [x] **[Critico]** Integridade verificada via checksum/hash. `npm ci` valida lockfile quando presente.
- [x] **[Critico]** Nao usa `curl | bash` ou `wget | sh`. Nao ha esse padrao.
- [x] **[Importante]** Dependencias transitivas auditadas. `npm audit --audit-level=high`.

## Auditoria de vulnerabilidades

- [x] **[Critico]** Executa auditoria apos instalacao. Implementado.
- [x] **[Critico]** Falha em vulnerabilidades criticas. `npm audit --audit-level=high` falha para high/critical.
- [ ] **[Importante]** CVEs sem correcao documentados. Nao implementado.
- [ ] **[Importante]** Verificacao de typosquatting. Nao implementado.

## Execucao segura do script

- [x] **[Critico]** Nao executado como root/admin desnecessariamente. Bloqueia root/sudo.
- [x] **[Critico]** Interrompe em erro. Falhas encerram com exit code 1.
- [x] **[Critico]** Credenciais nao hardcoded. Nao ha credenciais.
- [ ] **[Critico]** Entradas externas validadas/sanitizadas. Usa `execSync(command, { shell: '/bin/bash' })`; comandos sao internos, mas shell string e desnecessario.
- [x] **[Importante]** Valida ambiente antes de executar. Usa Zod para `NODE_ENV`, valida Node e root.

## Atualizacoes e controle de mudanca

- [ ] **[Critico]** Atualizacoes passam por testes antes de producao. Apenas avisa outdated; nao roda testes.
- [x] **[Importante]** Distingue dev/staging/prod. Usa `NODE_ENV=production` para `--only=production`.
- [ ] **[Importante]** Rollback documentado. Nao implementado.
- [x] **[Importante]** Major versions nao atualizadas automaticamente. Nao executa update automatico, apenas `npm outdated`.
- [ ] **[Recomendado]** Loga pacotes instalados/atualizados e versoes. Loga etapas, nao inventario.

## Isolamento e ambiente

- [x] **[Critico]** Dependencias instaladas em ambiente isolado/local. Usa `node_modules` local.
- [x] **[Importante]** Dev dependencies nao instaladas em producao. Usa `npm ci --only=production --ignore-scripts`.
- [x] **[Importante]** Script idempotente. `npm ci` torna instalacao limpa e reproduzivel.
- [ ] **[Recomendado]** Temporarios removidos ao final. Nao implementado.
- [ ] **[Recomendado]** Revisado com analise estatica. Nao indicado.
