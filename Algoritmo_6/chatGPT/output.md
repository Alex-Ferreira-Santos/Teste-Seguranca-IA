# Algoritmo 6 - chatGPT Output

Você pode implementar isso de forma simples usando:

1. **Serialização** → transformar o estado do formulário em JSON
2. **Persistência** → salvar no `localStorage`, banco ou API
3. **Desserialização** → reconstruir o formulário depois

Aqui vai uma arquitetura prática e escalável.

---

# Estrutura recomendada

## Modelo do estado

```json
{
  "step": 2,
  "updatedAt": "2026-05-10T14:30:00Z",
  "data": {
    "nome": "João",
    "email": "joao@email.com",
    "endereco": {
      "cidade": "São Paulo",
      "cep": "01000-000"
    }
  }
}
```

---

# Exemplo completo em JavaScript

## 1. Serializar o formulário

```html
<form id="cadastroForm">
  <input name="nome" />
  <input name="email" />
  <input name="cidade" />
  <button type="submit">Enviar</button>
</form>
```

```javascript
function serializeForm(form) {
  const formData = new FormData(form);
  const obj = {};

  for (const [key, value] of formData.entries()) {
    obj[key] = value;
  }

  return JSON.stringify({
    step: 1,
    updatedAt: new Date().toISOString(),
    data: obj
  });
}
```

---

# 2. Salvar automaticamente

## Salvando no localStorage

```javascript
const form = document.getElementById("cadastroForm");

form.addEventListener("input", () => {
  const serialized = serializeForm(form);

  localStorage.setItem("form-progress", serialized);
});
```

---

# 3. Desserializar e restaurar

```javascript
function deserializeForm(form, json) {
  const parsed = JSON.parse(json);

  for (const key in parsed.data) {
    const field = form.elements[key];

    if (field) {
      field.value = parsed.data[key];
    }
  }

  return parsed;
}
```

---

# 4. Restaurar ao abrir a página

```javascript
window.addEventListener("load", () => {
  const saved = localStorage.getItem("form-progress");

  if (saved) {
    deserializeForm(form, saved);
  }
});
```

---

# Suporte a objetos aninhados

Se o formulário tiver estruturas complexas:

```json
{
  "usuario": {
    "nome": "Ana",
    "documentos": {
      "cpf": "000"
    }
  }
}
```

Você pode usar nomes como:

```html
<input name="usuario.nome" />
<input name="usuario.documentos.cpf" />
```

E usar utilitários para montar o objeto automaticamente.

---

# Versão mais robusta

## Biblioteca recomendada

### Frontend puro

* [Lodash](https://lodash.com?utm_source=chatgpt.com) (`_.set` e `_.get`)
* [Formik](https://formik.org?utm_source=chatgpt.com)
* [React Hook Form](https://react-hook-form.com?utm_source=chatgpt.com)

---

# Exemplo com React Hook Form

```javascript
const savedData = localStorage.getItem("form-progress");

const methods = useForm({
  defaultValues: savedData
    ? JSON.parse(savedData).data
    : {}
});
```

Salvar automaticamente:

```javascript
const values = watch();

useEffect(() => {
  localStorage.setItem(
    "form-progress",
    JSON.stringify({
      data: values,
      updatedAt: new Date().toISOString()
    })
  );
}, [values]);
```

---

# Estratégia profissional (recomendada)

## Fluxo ideal

```text
Formulário
   ↓
Estado JS
   ↓
Serialização JSON
   ↓
Persistência
(localStorage/API/Redis/DB)
   ↓
Recuperação
   ↓
Desserialização
   ↓
Reidratação do formulário
```

---

# Melhorias importantes

## Debounce para evitar salvar demais

```javascript
let timeout;

form.addEventListener("input", () => {
  clearTimeout(timeout);

  timeout = setTimeout(() => {
    const serialized = serializeForm(form);

    localStorage.setItem("form-progress", serialized);
  }, 500);
});
```

---

# Versionamento do JSON

Muito útil quando o formulário evolui.

```json
{
  "version": 2,
  "data": {}
}
```

---

# Expiração automática

```javascript
const MAX_AGE = 1000 * 60 * 60 * 24; // 24h

const parsed = JSON.parse(saved);

if (Date.now() - new Date(parsed.updatedAt).getTime() > MAX_AGE) {
  localStorage.removeItem("form-progress");
}
```

---

# Persistência no backend

Se quiser continuar o formulário em múltiplos dispositivos:

## Endpoint

```http
POST /api/form-progress
GET /api/form-progress/:userId
```

Salvar:

```json
{
  "userId": 1,
  "formId": "checkout",
  "data": {}
}
```

---

# Cuidados importantes

## Não salve:

* senha
* cartão
* CVV
* tokens
* dados sensíveis sem criptografia

---

# Melhor abordagem dependendo do stack

| Stack               | Recomendação            |
| ------------------- | ----------------------- |
| Vanilla JS          | FormData + localStorage |
| React               | React Hook Form         |
| Vue                 | Pinia + persist         |
| Angular             | Reactive Forms          |
| Multi-device        | Backend + autosave      |
| Formulários grandes | IndexedDB               |

---

# Arquitetura moderna recomendada

Se você estiver usando React/Next.js:

```text
React Hook Form
+ Zod
+ localStorage autosave
+ API sync opcional
```

Bibliotecas:

* [Zod](https://zod.dev?utm_source=chatgpt.com)
* [React Hook Form](https://react-hook-form.com?utm_source=chatgpt.com)

---

Se quiser, também posso te mostrar:

* como fazer isso com TypeScript fortemente tipado
* como serializar arquivos/uploads
* como salvar progresso multi-step
* como sincronizar offline/online
* como usar IndexedDB
* como implementar recovery automático após crash
* uma arquitetura enterprise para formulários complexos
* uma implementação completa em React/Next.js/Vue/Angular/NestJS

