# Checklist - projeto

Analise baseada em `projeto/setup.js`.

## Integridade e origem das dependencias

- [x] **[Critico]** Dependencias instaladas de fontes oficiais/confiaveis. Usa npm, sem registry alternativo.
- [ ] **[Critico]** Versoes fixadas com lockfile. Usa `npm ci` se houver lockfile, mas cai para `npm install` e depois `npm update`.
- [ ] **[Critico]** Integridade verificada via checksum/hash. `npm ci` ajuda quando ha lockfile, mas nao e obrigatorio.
- [x] **[Critico]** Nao usa `curl | bash` ou `wget | sh`. Nao ha download remoto executado como shell.
- [ ] **[Importante]** Dependencias transitivas auditadas. Nao executa `npm audit`.

## Auditoria de vulnerabilidades

- [ ] **[Critico]** Executa auditoria apos instalacao. Nao implementado.
- [ ] **[Critico]** Falha em vulnerabilidades criticas. Nao implementado.
- [ ] **[Importante]** CVEs sem correcao documentados. Nao implementado.
- [ ] **[Importante]** Verificacao de typosquatting. Nao implementado.

## Execucao segura do script

- [ ] **[Critico]** Nao executado como root/admin desnecessariamente. Nao valida usuario.
- [x] **[Critico]** Interrompe em erro. `run()` encerra com `process.exit(1)`.
- [x] **[Critico]** Credenciais nao hardcoded. `.env` padrao nao inclui segredos reais.
- [x] **[Critico]** Entradas externas validadas/sanitizadas. Nao usa argumentos externos em comandos.
- [x] **[Importante]** Valida ambiente antes de executar. Verifica Node.js 18+.

## Atualizacoes e controle de mudanca

- [ ] **[Critico]** Atualizacoes passam por testes antes de producao. Executa `npm update` diretamente.
- [ ] **[Importante]** Distingue dev/staging/prod. Cria `NODE_ENV=development`, mas nao altera comportamento por ambiente.
- [ ] **[Importante]** Rollback documentado. Nao implementado.
- [ ] **[Importante]** Major versions nao atualizadas automaticamente. `npm update` pode alterar dentro dos ranges do package.json, sem revisao.
- [x] **[Recomendado]** Loga pacotes/comandos instalados/atualizados com timestamp. Loga comandos, mas sem timestamp nem versoes dos pacotes.

## Isolamento e ambiente

- [x] **[Critico]** Dependencias instaladas em ambiente isolado/local. Usa `node_modules` local.
- [ ] **[Importante]** Dev dependencies nao instaladas em producao. Nao usa `--production`.
- [x] **[Importante]** Script idempotente. Reexecuta instalacao, copia `.env` apenas se ausente e detecta scripts.
- [ ] **[Recomendado]** Temporarios removidos ao final. Nao implementado.
- [ ] **[Recomendado]** Revisado com analise estatica. Nao indicado.
