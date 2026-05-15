# Checklist - projeto

Analise baseada em `projeto/setup.js`, `package.json` e `index.js`.

## Integridade e origem das dependencias

- [ ] **[Critico]** Dependencias instaladas de fontes oficiais/confiaveis. Usa npm/yarn/pnpm/brew/apt e instala Homebrew via `curl | bash`.
- [ ] **[Critico]** Versoes fixadas com lockfile. Instala com `npm install`, `yarn install` ou `pnpm install` sem modo congelado e cria `.gitignore` ignorando lockfiles.
- [ ] **[Critico]** Integridade verificada via checksum/hash. Nao implementado.
- [ ] **[Critico]** Nao instala via `curl | bash` sem verificacao. Instala Homebrew com `curl -fsSL ... | bash`.
- [ ] **[Importante]** Dependencias transitivas auditadas. Nao executa audit.

## Auditoria de vulnerabilidades

- [ ] **[Critico]** Executa auditoria apos instalacao. Nao implementado.
- [ ] **[Critico]** Falha em vulnerabilidades criticas. Nao implementado.
- [ ] **[Importante]** CVEs sem correcao documentados. Nao implementado.
- [ ] **[Importante]** Verificacao de typosquatting. Nao implementado.

## Execucao segura do script

- [ ] **[Critico]** Nao executado como root/admin desnecessariamente. Usa `sudo apt-get` e instala globais.
- [x] **[Critico]** Interrompe em erro. `runCommand` lanca erro, exceto quando `ignoreError` e usado.
- [ ] **[Critico]** Credenciais nao hardcoded. Cria `.env` com placeholders de `API_KEY` e `SECRET_KEY`, risco de uso indevido.
- [ ] **[Critico]** Entradas externas validadas/sanitizadas. Usa `execSync` com strings incluindo `$EDITOR` e comandos shell.
- [x] **[Importante]** Valida ambiente antes de executar. Verifica Node, plataforma e package manager.

## Atualizacoes e controle de mudanca

- [ ] **[Critico]** Atualizacoes passam por testes antes de producao. Atualiza se o usuario confirmar, sem testes.
- [ ] **[Importante]** Distingue dev/staging/prod. Nao implementado.
- [ ] **[Importante]** Rollback documentado. Nao implementado; ainda ignora lockfiles no `.gitignore`.
- [ ] **[Importante]** Major versions nao atualizadas automaticamente. Instala ferramentas globais e upgrades sem politica de major.
- [x] **[Recomendado]** Loga pacotes instalados/atualizados e versoes. Relatorio final registra gerenciador/data, mas nao versoes de dependencias.

## Isolamento e ambiente

- [ ] **[Critico]** Dependencias instaladas em ambiente isolado/local. Instala ferramentas globais e dependencias de sistema.
- [ ] **[Importante]** Dev dependencies nao instaladas em producao. Nao usa modo production.
- [ ] **[Importante]** Script idempotente. Modifica package.json, cria diretórios, inicializa git e instala globais.
- [ ] **[Recomendado]** Temporarios removidos ao final. Nao implementado.
- [ ] **[Recomendado]** Revisado com analise estatica. Nao indicado.
