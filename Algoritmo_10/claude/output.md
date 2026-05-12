# Algoritmo 10 - claude Output

Vou criar dois scripts — um `setup.sh` para Linux/macOS e um `setup.ps1` para Windows — que detectam o gerenciador de pacotes disponível (npm, yarn ou pnpm), instalam as dependências e validam o ambiente.Dois scripts prontos, um para cada plataforma. Veja o que cada um faz:

**`setup.sh`** — Linux / macOS
```bash
bash setup.sh

# Para checar pacotes desatualizados também:
CHECK_UPDATES=true bash setup.sh
```

**`setup.ps1`** — Windows
```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1

# Para checar pacotes desatualizados também:
powershell -ExecutionPolicy Bypass -File setup.ps1 -CheckUpdates
```

---

**O que os scripts fazem, em ordem:**

1. **Verificam Node.js** — se não estiver instalado, aborta com mensagem clara. Também avisa se a versão for menor que v18.
2. **Detectam o gerenciador de pacotes automaticamente** — prioriza `pnpm` (se houver `pnpm-lock.yaml`), depois `yarn` (se houver `yarn.lock`), e cai no `npm` por padrão.
3. **Verificam o `package.json`** — garante que o script está sendo executado na raiz do projeto.
4. **Instalam as dependências** com o gerenciador detectado.
5. **Verificam atualizações** (opcional, via flag).

Se quiser adicionar mais etapas — como copiar `.env.example` para `.env`, rodar build, ou checar versão mínima do Node — é só falar!

---

# PROMPT 2

Pronto! Coloque o `setup.js` na raiz do projeto e execute:

```bash
# Instalar dependências
node setup.js

# Instalar + verificar pacotes desatualizados
node setup.js --check-updates
```

**O que o script faz:**

1. **Verifica o Node.js** — avisa se a versão for menor que v18
2. **Valida o `package.json`** — garante que está na raiz do projeto
3. **Detecta o gerenciador automaticamente** — `pnpm` → `yarn` → `npm`, baseado nos arquivos de lock presentes
4. **Instala as dependências** com o gerenciador detectado
5. **Checa atualizações** (opcional, via `--check-updates`)

Usa apenas módulos nativos do Node.js (`child_process`, `fs`, `path`) — sem nenhuma dependência externa.


