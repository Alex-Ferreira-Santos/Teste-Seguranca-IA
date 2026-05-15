# Checklist - projeto_seguro

Analise baseada em `scripts/setup.ts`, `scripts/security-audit.ts`, `scripts/update-deps.ts`, `scripts/validate-env.ts` e `package.json`.

## Integridade e origem das dependencias

- [x] **[Critico]** Dependencias instaladas de fontes oficiais/confiaveis. Usa pnpm sem registry customizado.
- [x] **[Critico]** Versoes fixadas com lockfile. `setup.ts` usa `pnpm install --frozen-lockfile`.
- [x] **[Critico]** Integridade verificada via checksum/hash. Lockfile congelado e pnpm validam integridade do lockfile.
- [x] **[Critico]** Nao usa `curl | bash` ou `wget | sh`. Nao ha esse padrao.
- [x] **[Importante]** Dependencias transitivas auditadas. `pnpm audit` audita arvore de dependencias.

## Auditoria de vulnerabilidades

- [x] **[Critico]** Executa auditoria apos instalacao. `setup.ts` chama `pnpm audit --prod`.
- [x] **[Critico]** Falha em vulnerabilidades criticas. `security-audit.ts` falha para critical ou high.
- [ ] **[Importante]** CVEs sem correcao documentados. Nao ha arquivo de excecoes/justificativas.
- [ ] **[Importante]** Verificacao de typosquatting. Lista permitida em update ajuda, mas instalacao nao confere nomes oficiais.

## Execucao segura do script

- [x] **[Critico]** Nao executado como root/admin desnecessariamente. `validate-env.ts` bloqueia root fora do Windows.
- [x] **[Critico]** Interrompe em erro. Promises rejeitadas encerram com exit code 1.
- [x] **[Critico]** Credenciais nao hardcoded. Usa `process.env`, sem tokens fixos.
- [x] **[Critico]** Entradas externas validadas/sanitizadas. Usa `execFile` com `shell:false` e argumentos fixos.
- [x] **[Importante]** Valida ambiente antes de executar. Valida Node `>=22 <23`, root e bloqueia producao.

## Atualizacoes e controle de mudanca

- [ ] **[Critico]** Atualizacoes passam por testes antes de producao. Nao executa testes antes/depois.
- [x] **[Importante]** Distingue dev/staging/prod. Bloqueia `NODE_ENV=production`.
- [ ] **[Importante]** Rollback documentado. Nao implementado.
- [ ] **[Importante]** Major versions nao atualizadas automaticamente. `update-deps.ts` usa `--latest`, permitindo major.
- [x] **[Recomendado]** Loga pacotes instalados/atualizados e versoes. Registra comandos/pacotes, mas nao captura versao final de cada pacote.

## Isolamento e ambiente

- [x] **[Critico]** Dependencias instaladas em ambiente isolado/local. Usa dependencias locais via pnpm.
- [x] **[Importante]** Dev dependencies nao instaladas em producao. Auditoria usa `--prod`; execucao em producao e bloqueada.
- [x] **[Importante]** Script idempotente. `--frozen-lockfile` torna instalacao reproduzivel.
- [ ] **[Recomendado]** Temporarios removidos ao final. Nao implementado.
- [ ] **[Recomendado]** Revisado com analise estatica. Nao indicado.
