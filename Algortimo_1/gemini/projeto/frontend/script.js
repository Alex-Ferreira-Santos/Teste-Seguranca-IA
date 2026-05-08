document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Impede o recarregamento da página

    const usuarioDigitado = document.getElementById('username').value;
    const senhaDigitada = document.getElementById('password').value;
    const mensagem = document.getElementById('message');

    mensagem.textContent = "Verificando...";
    mensagem.style.color = "blue";

    try {
        // Faz a "ligação" para o servidor (Back-end)
        const resposta = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario: usuarioDigitado,
                senha: senhaDigitada
            })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            // Se o servidor disser que o login está OK
            mensagem.style.color = "green";
            mensagem.textContent = "Login realizado! Redirecionando...";
            
            // Guardamos o "Token" (o crachá de acesso) no navegador
            localStorage.setItem('token', dados.token);

            setTimeout(() => {
                alert("Bem-vindo! Você está autenticado.");
                // window.location.href = "dashboard.html"; 
            }, 1500);
        } else {
            // Se o servidor negar o acesso
            mensagem.style.color = "red";
            mensagem.textContent = dados.mensagem || "Usuário ou senha incorretos.";
        }

    } catch (erro) {
        mensagem.style.color = "red";
        mensagem.textContent = "Erro: O servidor está desligado.";
        console.error("Erro na conexão:", erro);
    }
});