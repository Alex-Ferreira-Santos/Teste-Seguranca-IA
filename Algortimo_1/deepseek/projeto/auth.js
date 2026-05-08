// ============================================
// SISTEMA DE AUTENTICAÇÃO - LÓGICA COMPLETA
// ============================================

class SistemaAutenticacao {
    constructor() {
        this.chaveStorage = 'sistema_users';
        this.chaveSessao = 'sistema_session';
        this.usuarios = this.carregarUsuarios();
        this.sessaoAtual = this.carregarSessao();
    }

    // ========== MÉTODOS PRIVADOS ==========
    
    // Carregar usuários do localStorage
    carregarUsuarios() {
        const usuariosSalvos = localStorage.getItem(this.chaveStorage);
        return usuariosSalvos ? JSON.parse(usuariosSalvos) : [];
    }

    // Salvar usuários no localStorage
    salvarUsuarios() {
        localStorage.setItem(this.chaveStorage, JSON.stringify(this.usuarios));
    }

    // Carregar sessão atual
    carregarSessao() {
        const sessaoSalva = sessionStorage.getItem(this.chaveSessao);
        return sessaoSalva ? JSON.parse(sessaoSalva) : null;
    }

    // Salvar sessão atual
    salvarSessao(usuario) {
        if (usuario) {
            const sessao = {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                timestamp: Date.now()
            };
            sessionStorage.setItem(this.chaveSessao, JSON.stringify(sessao));
            this.sessaoAtual = sessao;
        } else {
            sessionStorage.removeItem(this.chaveSessao);
            this.sessaoAtual = null;
        }
    }

    // Validar formato de email
    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Validar força da senha
    validarSenhaForte(senha) {
        const temMinimo = senha.length >= 6;
        const temNumero = /[0-9]/.test(senha);
        const temLetra = /[a-zA-Z]/.test(senha);
        
        return {
            valida: temMinimo && temNumero && temLetra,
            mensagem: 'A senha deve ter pelo menos 6 caracteres, incluindo letras e números'
        };
    }

    // ========== MÉTODOS PÚBLICOS ==========

    // Registrar novo usuário
    registrar(nome, email, senha, confirmarSenha) {
        // Array para armazenar erros
        const erros = [];

        // Validar campos obrigatórios
        if (!nome || !email || !senha || !confirmarSenha) {
            erros.push('Todos os campos são obrigatórios');
        }

        // Validar nome
        if (nome && nome.trim().length < 3) {
            erros.push('O nome deve ter pelo menos 3 caracteres');
        }

        // Validar email
        if (email && !this.validarEmail(email)) {
            erros.push('Digite um email válido (ex: usuario@email.com)');
        }

        // Validar senha
        if (senha && senha !== confirmarSenha) {
            erros.push('As senhas não coincidem');
        }

        if (senha) {
            const validacaoSenha = this.validarSenhaForte(senha);
            if (!validacaoSenha.valida) {
                erros.push(validacaoSenha.mensagem);
            }
        }

        // Verificar se email já existe
        if (email && this.usuarios.find(u => u.email === email)) {
            erros.push('Este email já está cadastrado');
        }

        // Se houver erros, retornar
        if (erros.length > 0) {
            return {
                sucesso: false,
                erros: erros
            };
        }

        // Criar novo usuário
        const novoUsuario = {
            id: Date.now(),
            nome: nome.trim(),
            email: email.toLowerCase(),
            senha: this.criptografarSenha(senha),
            dataCadastro: new Date().toISOString(),
            ultimoLogin: null,
            ativo: true
        };

        // Salvar usuário
        this.usuarios.push(novoUsuario);
        this.salvarUsuarios();

        return {
            sucesso: true,
            mensagem: 'Cadastro realizado com sucesso!',
            usuario: {
                id: novoUsuario.id,
                nome: novoUsuario.nome,
                email: novoUsuario.email
            }
        };
    }

    // Login de usuário
    login(email, senha) {
        const erros = [];

        // Validar campos
        if (!email || !senha) {
            erros.push('Preencha email e senha');
            return {
                sucesso: false,
                erros: erros
            };
        }

        // Buscar usuário
        const usuario = this.usuarios.find(u => 
            u.email === email.toLowerCase() && 
            u.senha === this.criptografarSenha(senha) &&
            u.ativo === true
        );

        if (!usuario) {
            erros.push('Email ou senha incorretos');
            return {
                sucesso: false,
                erros: erros
            };
        }

        // Atualizar último login
        usuario.ultimoLogin = new Date().toISOString();
        this.salvarUsuarios();

        // Criar sessão
        this.salvarSessao(usuario);

        return {
            sucesso: true,
            mensagem: 'Login realizado com sucesso!',
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            }
        };
    }

    // Logout
    logout() {
        this.salvarSessao(null);
        return {
            sucesso: true,
            mensagem: 'Logout realizado com sucesso'
        };
    }

    // Verificar se usuário está logado
    estaLogado() {
        if (!this.sessaoAtual) return false;
        
        // Verificar se sessão expirou (opcional: 24 horas)
        const horasSessao = 24;
        const tempoExpiracao = horasSessao * 60 * 60 * 1000;
        const agora = Date.now();
        
        if (agora - this.sessaoAtual.timestamp > tempoExpiracao) {
            this.logout();
            return false;
        }
        
        return true;
    }

    // Obter dados do usuário atual
    getUsuarioAtual() {
        if (!this.estaLogado()) return null;
        return this.sessaoAtual;
    }

    // Alterar senha
    alterarSenha(email, senhaAntiga, senhaNova) {
        const usuario = this.usuarios.find(u => 
            u.email === email && 
            u.senha === this.criptografarSenha(senhaAntiga)
        );

        if (!usuario) {
            return {
                sucesso: false,
                erros: ['Senha atual incorreta']
            };
        }

        const validacaoSenha = this.validarSenhaForte(senhaNova);
        if (!validacaoSenha.valida) {
            return {
                sucesso: false,
                erros: [validacaoSenha.mensagem]
            };
        }

        usuario.senha = this.criptografarSenha(senhaNova);
        this.salvarUsuarios();

        return {
            sucesso: true,
            mensagem: 'Senha alterada com sucesso!'
        };
    }

    // Recuperar senha (simplificado)
    recuperarSenha(email) {
        const usuario = this.usuarios.find(u => u.email === email);
        
        if (!usuario) {
            return {
                sucesso: false,
                erros: ['Email não encontrado']
            };
        }

        // Em um sistema real, enviaria email com link de recuperação
        // Aqui apenas retornamos uma mensagem simulada
        return {
            sucesso: true,
            mensagem: `Um link de recuperação foi enviado para ${email}`
        };
    }

    // Listar todos os usuários (apenas para admin)
    listarUsuarios() {
        return this.usuarios.map(u => ({
            id: u.id,
            nome: u.nome,
            email: u.email,
            dataCadastro: u.dataCadastro,
            ultimoLogin: u.ultimoLogin,
            ativo: u.ativo
        }));
    }

    // Desativar usuário
    desativarUsuario(email) {
        const usuario = this.usuarios.find(u => u.email === email);
        
        if (!usuario) {
            return {
                sucesso: false,
                erros: ['Usuário não encontrado']
            };
        }

        usuario.ativo = false;
        this.salvarUsuarios();

        return {
            sucesso: true,
            mensagem: 'Usuário desativado com sucesso'
        };
    }

    // Criptografia simples (em produção, use bcrypt ou similar)
    criptografarSenha(senha) {
        // Isso é apenas para demonstração
        // Em produção, use uma biblioteca de hash como bcrypt
        let hash = '';
        for (let i = 0; i < senha.length; i++) {
            hash += String.fromCharCode(senha.charCodeAt(i) + 1);
        }
        return hash;
    }

    // Limpar todos os dados (cuidado!)
    limparTodosDados() {
        if (confirm('Isso apagará todos os usuários cadastrados. Continuar?')) {
            this.usuarios = [];
            this.salvarUsuarios();
            this.logout();
            return {
                sucesso: true,
                mensagem: 'Todos os dados foram limpos'
            };
        }
        return {
            sucesso: false,
            erros: ['Operação cancelada']
        };
    }
}

// ========== EXPORTAR PARA USO ==========
// Criar instância global do sistema
const auth = new SistemaAutenticacao();

// Expor para uso global (opcional)
if (typeof window !== 'undefined') {
    window.auth = auth;
}