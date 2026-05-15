# Checklist - projeto_seguro

Analise baseada em `projeto_seguro/install.ts`, `package.json` e `dockerfile`.

## Integridade e origem das dependencias

- [x] **[Critico]** Dependencias instaladas de fontes oficiais/confiaveis. Permite apenas package managers configurados, por padrao npm.
- [x] **[Critico]** Versoes fixadas com lockfile. `package.json` usa versoes exatas; script verifica lockfile, mas ainda permite seguir sem ele.
- [ ] **[Critico]** Integridade verificada via checksum/hash. Tenta verificar hash do binario do package manager, mas usa placeholder `expected_hash_here`, tornando a checagem impraticavel.
- [x] **[Critico]** Nao usa `curl | bash` ou `wget | sh`. Nao ha esse padrao.
- [x] **[Importante]** Dependencias transitivas auditadas. Executa `npm audit --json`.

## Auditoria de vulnerabilidades

- [x] **[Critico]** Executa auditoria apos instalacao. Audita antes da instalacao e apos update.
- [x] **[Critico]** Falha em vulnerabilidades criticas. Falha se `metadata.vulnerabilities.total > 0`.
- [ ] **[Importante]** CVEs sem correcao documentados. Nao ha excecoes/justificativas.
- [x] **[Importante]** Verificacao de typosquatting. Verifica entradas suspeitas em `node_modules`, mas nao compara nomes contra pacote oficial antes de instalar.

## Execucao segura do script

- [x] **[Critico]** Nao executado como root/admin desnecessariamente. Dockerfile cria e usa usuario `nodejs`.
- [x] **[Critico]** Interrompe em erro. Exceptions propagam e `main` encerra com exit code 1.
- [x] **[Critico]** Credenciais nao hardcoded. Nao ha tokens/senhas de registry.
- [x] **[Critico]** Entradas externas validadas/sanitizadas. Usa `execFile` com `shell:false` e valida diretório/package manager.
- [x] **[Importante]** Valida ambiente antes de executar. Bloqueia paths sensiveis, checa permissoes e bloqueia producao fora de CI.

## Atualizacoes e controle de mudanca

- [ ] **[Critico]** Atualizacoes passam por testes antes de producao. Nao roda testes automatizados.
- [x] **[Importante]** Distingue dev/staging/prod. Executa apenas em development ou CI; bloqueia producao.
- [x] **[Importante]** Rollback documentado/implementado. Faz backup de manifests e restaura em falha.
- [ ] **[Importante]** Major versions nao atualizadas automaticamente. `npm update` nao usa `--latest`, mas nao ha politica explicita contra major nos ranges.
- [x] **[Recomendado]** Loga pacotes instalados/atualizados e versoes. Mantem auditLog de acoes com timestamp, mas nao inventario de versoes.

## Isolamento e ambiente

- [x] **[Critico]** Dependencias instaladas em ambiente isolado/local. Usa container e `node_modules` local.
- [ ] **[Importante]** Dev dependencies nao instaladas em producao. Nao usa `--omit=dev`; Docker executa installer em stage de build.
- [x] **[Importante]** Script idempotente. Revalida e reinstala de forma controlada; rollback reduz efeitos colaterais.
- [x] **[Recomendado]** Temporarios removidos ao final. Remove backups ao restaurar; nao ha limpeza ampla de cache/tarballs.
- [ ] **[Recomendado]** Revisado com analise estatica. Nao indicado.
