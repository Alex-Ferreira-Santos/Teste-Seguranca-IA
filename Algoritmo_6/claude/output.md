# Algoritmo 6 - claude Output

O arquivo está pronto para usar. Aqui está um resumo do que foi implementado:

---

## O que o código faz

**Serialização** — `serializeForm()` coleta todos os campos e transforma em um objeto JSON estruturado com `JSON.stringify()`.

**Deserialização** — `deserializeForm(data)` lê o objeto e restaura cada campo do formulário com `JSON.parse()`, inclusive checkboxes e range slider.

**Auto-save com debounce** — a cada vez que o usuário para de digitar por 800ms, o estado é salvo automaticamente no `localStorage`.

**Restauração automática** — ao abrir a página, o `loadProgress()` verifica se há dados salvos e restaura tudo silenciosamente.

---

## Funções principais para adaptar ao seu projeto

| Função | Responsabilidade |
|---|---|
| `serializeForm()` | Formulário → objeto JS |
| `deserializeForm(data)` | Objeto JS → formulário |
| `saveProgress()` | Salva manualmente no localStorage |
| `loadProgress()` | Lê e parseia do localStorage |
| `clearProgress()` | Remove os dados salvos |
| `submitForm()` | Ponto de integração com sua API |

Para integrar com backend, substitua o `localStorage.setItem` por um `fetch('/sua-api', { method: 'POST', body: JSON.stringify(data) })`