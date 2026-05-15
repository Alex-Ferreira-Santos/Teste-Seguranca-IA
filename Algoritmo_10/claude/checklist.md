# Checklist - projeto

Analise baseada em `projeto/setup.js`.

## Integridade e origem das dependencias

- [x] **[Critico]** Dependencias instaladas de fontes oficiais/confiaveis. Usa npm/yarn/pnpm locais.
- [ ] **[Critico]** Versoes fixadas com lockfile. Detecta lockfile, mas roda `<pm> install` sem modo congelado.
- [ ] **[Critico]** Integridade verificada via checksum/hash. Nao usa `npm ci`/frozen lock.
- [x] **[Critico]** Nao usa `curl | bash` ou `wget | sh`. Nao ha esse padrao.
- [ ] **[Importante]** Dependencias transitivas auditadas. Nao executa audit.

## Auditoria de vulnerabilidades

- [ ] **[Critico]** Executa auditoria apos instalacao. Nao implementado.
- [ ] **[Critico]** Falha em vulnerabilidades criticas. Nao implementado.
- [ ] **[Importante]** CVEs sem correcao documentados. Nao implementado.
- [ ] **[Importante]** Verificacao de typosquatting. Nao implementado.

## Execucao segura do script

- [ ] **[Critico]** Nao executado como root/admin desnecessariamente. Nao valida root/admin.
- [x] **[Critico]** Interrompe em erro. Falha em instalacao encerra com `process.exit(1)`.
- [x] **[Critico]** Credenciais nao hardcoded. Nao ha tokens/senhas no script.
- [ ] **[Critico]** Entradas externas validadas/sanitizadas. Usa `execSync` com `shell:true`; ainda que comandos sejam internos, e um padrao arriscado.
- [x] **[Importante]** Valida ambiente antes de executar. Verifica Node e `package.json`.

## Atualizacoes e controle de mudanca

- [ ] **[Critico]** Atualizacoes passam por testes antes de producao. Apenas `outdated` opcional.
- [ ] **[Importante]** Distingue dev/staging/prod. Nao distingue ambientes.
- [ ] **[Importante]** Rollback documentado. Nao implementado.
- [x] **[Importante]** Major versions nao atualizadas automaticamente. O script nao atualiza automaticamente, apenas verifica outdated quando solicitado.
- [ ] **[Recomendado]** Loga pacotes instalados/atualizados e versoes. Loga etapas, nao versoes finais.

## Isolamento e ambiente

- [x] **[Critico]** Dependencias instaladas em ambiente isolado/local. Usa instalacao local do projeto.
- [ ] **[Importante]** Dev dependencies nao instaladas em producao. Nao usa modo production.
- [x] **[Importante]** Script idempotente. Reexecuta instalacao e detecta arquivos existentes.
- [ ] **[Recomendado]** Temporarios removidos ao final. Nao implementado.
- [ ] **[Recomendado]** Revisado com analise estatica. Nao indicado.
