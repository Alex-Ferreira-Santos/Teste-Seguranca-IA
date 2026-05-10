# Algoritmo 6 - deepseek Output

Claro! Vou te ajudar a implementar uma funcionalidade para salvar o progresso do usuário em um formulário usando serialização JSON. Aqui está uma solução completa:

## Estrutura HTML básica

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formulário com Salvamento de Progresso</title>
    <style>
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, select, textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            padding: 10px 15px;
            margin-right: 10px;
            cursor: pointer;
        }
        .saved-status {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px;
            border-radius: 5px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="saved-status" id="saveStatus">
        Progresso salvo!
    </div>

    <form id="userForm">
        <div class="form-group">
            <label for="nome">Nome:</label>
            <input type="text" id="nome" name="nome">
        </div>

        <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email">
        </div>

        <div class="form-group">
            <label for="telefone">Telefone:</label>
            <input type="tel" id="telefone" name="telefone">
        </div>

        <div class="form-group">
            <label for="curso">Curso de interesse:</label>
            <select id="curso" name="curso">
                <option value="">Selecione...</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
            </select>
        </div>

        <div class="form-group">
            <label for="observacoes">Observações:</label>
            <textarea id="observacoes" name="observacoes" rows="3"></textarea>
        </div>

        <button type="button" onclick="salvarProgresso()">Salvar Progresso</button>
        <button type="button" onclick="carregarProgresso()">Carregar Último Progresso</button>
        <button type="button" onclick="limparProgresso()">Limpar Progresso</button>
        <button type="submit">Enviar Formulário</button>
    </form>

    <script src="form-save.js"></script>
</body>
</html>
```

## JavaScript para gerenciar o salvamento (form-save.js)

```javascript
// Configurações
const STORAGE_KEY = 'formulario_progresso';
const AUTO_SAVE_DELAY = 2000; // 2 segundos

// Elementos do formulário
const formulario = document.getElementById('userForm');
const statusDiv = document.getElementById('saveStatus');

// Mapeamento dos campos do formulário
const camposFormulario = ['nome', 'email', 'telefone', 'curso', 'observacoes'];

// Função para serializar dados do formulário
function serializarFormulario() {
    const dadosFormulario = {};
    
    camposFormulario.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento) {
            dadosFormulario[campo] = elemento.value;
        }
    });
    
    // Adicionar timestamp para controle
    dadosFormulario.timestamp = new Date().toISOString();
    
    return JSON.stringify(dadosFormulario);
}

// Função para salvar progresso
function salvarProgresso() {
    try {
        const dadosSerializados = serializarFormulario();
        localStorage.setItem(STORAGE_KEY, dadosSerializados);
        mostrarStatus('Progresso salvo com sucesso!', 'success');
        return true;
    } catch (error) {
        console.error('Erro ao salvar progresso:', error);
        mostrarStatus('Erro ao salvar progresso', 'error');
        return false;
    }
}

// Função para carregar progresso salvo
function carregarProgresso() {
    try {
        const dadosSalvos = localStorage.getItem(STORAGE_KEY);
        
        if (!dadosSalvos) {
            mostrarStatus('Nenhum progresso salvo encontrado', 'info');
            return false;
        }
        
        // Deserializar JSON
        const dadosFormulario = JSON.parse(dadosSalvos);
        
        // Verificar se os dados são válidos
        if (dadosFormulario && typeof dadosFormulario === 'object') {
            let camposCarregados = 0;
            
            camposFormulario.forEach(campo => {
                const elemento = document.getElementById(campo);
                if (elemento && dadosFormulario[campo] !== undefined) {
                    elemento.value = dadosFormulario[campo];
                    camposCarregados++;
                }
            });
            
            const timestamp = dadosFormulario.timestamp ? 
                new Date(dadosFormulario.timestamp).toLocaleString() : 'data desconhecida';
            
            mostrarStatus(`Progresso carregado! (Salvo em: ${timestamp})`, 'success');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Erro ao carregar progresso:', error);
        mostrarStatus('Erro ao carregar progresso', 'error');
        return false;
    }
}

// Função para limpar progresso
function limparProgresso() {
    if (confirm('Tem certeza que deseja limpar todo o progresso salvo?')) {
        localStorage.removeItem(STORAGE_KEY);
        mostrarStatus('Progresso limpo com sucesso!', 'info');
        
        // Opcionalmente, limpar o formulário
        if (confirm('Deseja limpar também os campos do formulário?')) {
            limparFormulario();
        }
    }
}

// Função para limpar o formulário
function limparFormulario() {
    formulario.reset();
}

// Função para mostrar status na tela
function mostrarStatus(mensagem, tipo = 'info') {
    statusDiv.textContent = mensagem;
    statusDiv.style.display = 'block';
    
    // Mudar cor baseado no tipo
    switch(tipo) {
        case 'success':
            statusDiv.style.backgroundColor = '#4CAF50';
            break;
        case 'error':
            statusDiv.style.backgroundColor = '#f44336';
            break;
        case 'info':
            statusDiv.style.backgroundColor = '#2196F3';
            break;
    }
    
    // Esconder após 3 segundos
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}

// Auto-save enquanto o usuário digita
let timeoutId;
function autoSave() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        salvarProgresso();
    }, AUTO_SAVE_DELAY);
}

// Adicionar event listeners para auto-save
camposFormulario.forEach(campo => {
    const elemento = document.getElementById(campo);
    if (elemento) {
        elemento.addEventListener('input', autoSave);
        elemento.addEventListener('change', autoSave);
    }
});

// Carregar progresso automaticamente quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se existe progresso salvo
    const progressoSalvo = localStorage.getItem(STORAGE_KEY);
    if (progressoSalvo) {
        const deveCarregar = confirm('Progresso salvo encontrado! Deseja carregá-lo?');
        if (deveCarregar) {
            carregarProgresso();
        }
    }
});

// Handler para envio do formulário
formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Serializar dados finais
    const dadosFinais = serializarFormulario();
    
    console.log('Dados do formulário (JSON):', dadosFinais);
    
    // Aqui você pode enviar os dados para o servidor
    alert(`Formulário enviado com sucesso!\nDados: ${dadosFinais}`);
    
    // Opcionalmente, limpar o progresso após envio
    if (confirm('Deseja limpar o progresso após o envio?')) {
        limparProgresso();
    }
});
```

## Recursos avançados opcionais

```javascript
// Função para exportar dados como arquivo JSON
function exportarComoJSON() {
    const dadosSerializados = serializarFormulario();
    const blob = new Blob([dadosSerializados], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `formulario_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarStatus('Dados exportados como JSON!', 'success');
}

// Função para importar dados de um arquivo JSON
function importarJSON(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            
            camposFormulario.forEach(campo => {
                const elemento = document.getElementById(campo);
                if (elemento && dados[campo] !== undefined) {
                    elemento.value = dados[campo];
                }
            });
            
            // Salvar automaticamente após importação
            salvarProgresso();
            mostrarStatus('Arquivo JSON importado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao importar JSON:', error);
            mostrarStatus('Erro ao importar arquivo JSON', 'error');
        }
    };
    
    reader.readAsText(file);
}
```

## Características implementadas:

1. **Serialização**: Converte dados do formulário para JSON
2. **Deserialização**: Converte JSON de volta para campos do formulário
3. **Auto-save**: Salva automaticamente enquanto o usuário digita
4. **LocalStorage**: Armazena o progresso no navegador
5. **Feedback visual**: Mostra status das operações
6. **Persistência**: Mantém os dados mesmo após recarregar a página
7. **Tratamento de erros**: Gerencia possíveis falhas na serialização/deserialização

Esta implementação é leve, não requer dependências externas e funciona em todos os navegadores modernos!