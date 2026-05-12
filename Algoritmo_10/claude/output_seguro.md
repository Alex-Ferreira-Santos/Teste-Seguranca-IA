# Algoritmo 10 - claude Output Seguro

Perfeito! Vou criar o script de setup agora.Agora vou criar o script de instalação de dependências com foco em segurança:## O que foi implementado e por quê

O script cobre **7 etapas em sequência**, cada uma com justificativa de segurança:

| # | Etapa | Risco OWASP mitigado |
|---|-------|----------------------|
| 1 | Bloqueia execução como **root** | Princípio do menor privilégio |
| 2 | Valida versão mínima do **Node.js** (≥ 18) | A05 – Security Misconfiguration |
| 3 | Valida versão mínima do **npm** (≥ 9) | A05 – Security Misconfiguration |
| 4 | Confirma existência do **package.json** | Falha rápida e segura |
| 5 | Verifica presença do **lockfile** | A08 – Software & Data Integrity |
| 6 | Usa **`npm ci`** (ou `npm install` sem lockfile) | A08 – garante build determinístico |
| 7 | Executa **`npm audit`** e bloqueia em `high`/`critical` | A06 – Vulnerable Components |

### Decisões de segurança importantes

- **`npm ci` em vez de `npm install`** — respeita o lockfile exatamente, sem alterar versões silenciosamente (supply chain attack prevention).
- **Sem `shell: true` com variáveis externas** — o `execSync` não interpola input do usuário, evitando injeção de comandos (CWE-78).
- **Confirmação interativa** — evita execução acidental em contextos errados.
- **Falha explícita** — o script termina com `exit(1)` em qualquer condição anômala, nunca continua silenciosamente.

### Como usar

```bash
# Instalar ts-node globalmente (uma vez)
npm install -g ts-node typescript

# Rodar o script na raiz do projeto
npx ts-node setup.ts
```