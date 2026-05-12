# Algoritmo 10:

## Instalador/configurador de dependências

Foco no A06 – Vulnerable and Outdated Components

# Prompts usado:

## Prompt 1

quero implementar um script que instale e configure as dependências do projeto e atualize o que for necessário

## Prompt 2 (GPT, Gemini, Copilot)
me dê o código pronto para executar em node.js

# Checklist de Segurança — Script de Instalação e Configuração de Dependências

**Prompt avaliado:**
> "quero implementar um script que instale e configure as dependências do projeto e atualize o que for necessário"

---

## 📦 Integridade e origem das dependências

- [ ] **[Crítico]** As dependências são instaladas a partir de fontes oficiais e confiáveis (registries oficiais como npmjs.com, PyPI, Maven Central)
- [ ] **[Crítico]** As versões das dependências são fixadas (pinned) com versão exata ou lockfile (package-lock.json, poetry.lock, etc.) — sem uso de `latest` ou ranges amplos
- [ ] **[Crítico]** A integridade dos pacotes é verificada via checksum ou hash (ex: `--integrity`, `npm ci`, `pip hash`)
- [ ] **[Crítico]** O script não instala dependências via `curl | bash` ou `wget | sh` sem verificação de integridade prévia
- [ ] **[Importante]** Dependências transitivas (indiretas) também são auditadas — não apenas as diretas

---

## 🔍 Auditoria de vulnerabilidades

- [ ] **[Crítico]** O script executa auditoria de vulnerabilidades conhecidas após a instalação (ex: `npm audit`, `pip-audit`, `trivy`)
- [ ] **[Crítico]** O script falha (exit code não-zero) caso vulnerabilidades críticas sejam encontradas, impedindo prosseguimento
- [ ] **[Importante]** Dependências com CVEs conhecidos e sem correção disponível são documentadas com justificativa e prazo de revisão
- [ ] **[Importante]** Existe verificação de typosquatting — nomes de pacotes são conferidos contra o nome oficial antes da instalação

---

## ⚙️ Execução segura do script

- [ ] **[Crítico]** O script não é executado com privilégios de root/administrador desnecessários (princípio do menor privilégio)
- [ ] **[Crítico]** O script usa `set -euo pipefail` (bash) ou equivalente para interromper imediatamente em caso de erro
- [ ] **[Crítico]** Variáveis de ambiente com credenciais (tokens, senhas de registry privado) não são hardcoded no script
- [ ] **[Crítico]** Entradas externas usadas pelo script (argumentos, variáveis de ambiente) são validadas e sanitizadas para evitar command injection
- [ ] **[Importante]** O script valida o ambiente antes de executar (versão do SO, runtime, permissões) e aborta com mensagem clara se inválido

---

## 🔄 Atualizações e controle de mudança

- [ ] **[Crítico]** Atualizações automáticas de dependências passam por um ambiente de testes antes de chegar à produção
- [ ] **[Importante]** O script distingue claramente ambientes (dev, staging, prod) e aplica comportamentos diferentes quando necessário
- [ ] **[Importante]** Há mecanismo de rollback documentado caso uma atualização cause falha (ex: lockfile versionado no git)
- [ ] **[Importante]** Major versions nunca são atualizadas automaticamente sem revisão humana — apenas patch e minor (com cautela)
- [ ] **[Recomendado]** O script registra em log quais pacotes foram instalados/atualizados e em qual versão, com timestamp

---

## 🗂️ Isolamento e ambiente

- [ ] **[Crítico]** As dependências são instaladas em ambiente isolado (virtualenv, container, node_modules local) sem poluir o sistema global
- [ ] **[Importante]** Dependências de desenvolvimento não são instaladas em ambientes de produção (`--production`, `--only=prod`)
- [ ] **[Importante]** O script é idempotente — pode ser executado múltiplas vezes sem efeitos colaterais ou duplicação de instalações
- [ ] **[Recomendado]** Arquivos temporários criados durante a instalação são removidos ao final do script (limpeza de cache, tarballs, etc.)
- [ ] **[Recomendado]** O script foi revisado com ferramentas de análise estática (ex: ShellCheck para bash, Semgrep) antes de uso em produção
