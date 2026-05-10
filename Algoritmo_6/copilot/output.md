# Algoritmo 6 - copilot Output

Uma ótima ideia, Alex! Implementar salvamento de progresso em formulários usando **serialização e deserialização de objetos JSON** é uma prática moderna e eficiente. Vou te mostrar um caminho claro para isso:

---

## 🔹 Estrutura da solução

1. **Captura de dados**  
   - Obtenha os valores dos campos do formulário e transforme-os em um objeto JavaScript.

2. **Serialização JSON**  
   - Converta o objeto em uma string JSON usando `JSON.stringify()`.

3. **Armazenamento local**  
   - Salve essa string no `localStorage` ou `sessionStorage` do navegador.

4. **Deserialização JSON**  
   - Ao carregar a página, recupere os dados com `JSON.parse()` e preencha os campos do formulário.

---

## 🔹 Exemplo prático em JavaScript

```javascript
// Função para salvar progresso
function salvarProgresso() {
  const dadosFormulario = {
    nome: document.getElementById("nome").value,
    email: document.getElementById("email").value,
    idade: document.getElementById("idade").value
  };

  localStorage.setItem("progressoFormulario", JSON.stringify(dadosFormulario));
}

// Função para carregar progresso
function carregarProgresso() {
  const dadosSalvos = localStorage.getItem("progressoFormulario");
  if (dadosSalvos) {
    const dados = JSON.parse(dadosSalvos);
    document.getElementById("nome").value = dados.nome || "";
    document.getElementById("email").value = dados.email || "";
    document.getElementById("idade").value = dados.idade || "";
  }
}

// Executa ao carregar a página
window.onload = carregarProgresso;
```

---

## 🔹 Boas práticas

- **Validação**: sempre valide os dados antes de salvar.  
- **Segurança**: não armazene informações sensíveis em `localStorage`.  
- **UX**: informe ao usuário que o progresso está sendo salvo automaticamente.  
- **Limpeza**: ofereça opção para apagar os dados salvos.  

---

Quer que eu te mostre também como integrar isso com **back-end** (por exemplo, salvando o progresso no banco de dados do usuário) ou prefere manter apenas no **front-end com localStorage**?

---

# PROMPT 2

Aqui está um exemplo **pronto para executar** de um formulário HTML com salvamento automático do progresso usando **serialização e deserialização JSON** no `localStorage`. Basta copiar e colar em um arquivo `.html` e abrir no navegador:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Formulário com Salvamento de Progresso</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    label { display: block; margin-top: 10px; }
    input { padding: 5px; width: 250px; }
    button { margin-top: 15px; padding: 8px 12px; }
  </style>
</head>
<body>
  <h2>Formulário com Salvamento Automático</h2>
  <form id="meuFormulario">
    <label>Nome:
      <input type="text" id="nome" name="nome">
    </label>
    <label>Email:
      <input type="email" id="email" name="email">
    </label>
    <label>Idade:
      <input type="number" id="idade" name="idade">
    </label>
    <button type="button" onclick="salvarProgresso()">Salvar Manualmente</button>
    <button type="button" onclick="limparProgresso()">Limpar Dados Salvos</button>
  </form>

  <script>
    // Função para salvar progresso
    function salvarProgresso() {
      const dadosFormulario = {
        nome: document.getElementById("nome").value,
        email: document.getElementById("email").value,
        idade: document.getElementById("idade").value
      };
      localStorage.setItem("progressoFormulario", JSON.stringify(dadosFormulario));
      alert("Progresso salvo!");
    }

    // Função para carregar progresso
    function carregarProgresso() {
      const dadosSalvos = localStorage.getItem("progressoFormulario");
      if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos);
        document.getElementById("nome").value = dados.nome || "";
        document.getElementById("email").value = dados.email || "";
        document.getElementById("idade").value = dados.idade || "";
      }
    }

    // Função para limpar progresso
    function limparProgresso() {
      localStorage.removeItem("progressoFormulario");
      document.getElementById("meuFormulario").reset();
      alert("Dados salvos foram apagados!");
    }

    // Salvamento automático ao digitar
    document.getElementById("meuFormulario").addEventListener("input", salvarProgresso);

    // Carregar progresso ao abrir a página
    window.onload = carregarProgresso;
  </script>
</body>
</html>
```

---

### 🔹 O que esse código faz
- **Serializa** os dados do formulário em JSON.  
- **Salva** automaticamente no `localStorage` sempre que o usuário digita.  
- **Deserializa** os dados ao recarregar a página, preenchendo os campos.  
- Permite **limpar dados** com um botão.  

---

Quer que eu te mostre também como adaptar esse exemplo para **salvar no banco de dados via back-end** (PHP, Node.js, etc.), ou prefere manter apenas no navegador com `localStorage`?
