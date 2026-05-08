# Dados gerais:

Versão usada: Claude Sonnet 4.6

# Experiência sem o prompt de segurança

Foi feito perguntas para o usuário para entender mais sobre os projetos

```
P: Qual é o estilo visual do seu site?
R: Claro e profissional

P: O que o sistema de login precisa ter? (Selecione todas que se aplicam)
R: Login com e-mail e senha
```

Na primeira pergunta foi criado a página, mas foi explicado que precisaria de um sistema de autenticação real

Um segundo prompt foi feito para que ele siga com a implementação de uma lógica de autenticação

Novamente foi feito perguntas:

```
P: Onde os usuários e senhas serão guardados?
R: Ainda não sei / me recomende algo

P: Qual linguagem/tecnologia o seu servidor usa?
R: Node.js
```

Foi recomendado o uso Firebase Authentication do Google

Foi criado um arquivo HTML para o front end, um arquivo JS para o back-end e um .env

Foi recomendado a criação de um arquivo .gitignore para salvar o .env, com um aviso:

```
⚠️ Importante: Nunca suba o arquivo .env para o GitHub. Adicione-o ao .gitignore para proteger suas credenciais.
```


---------------------------

# Experiência com o prompt de segurança

Deu os arquivos mas não montou a estrutura certinho, apenas falou como deveria ser

De acordo com o que foi dito, essas foram as proteções implementadas:

🛡️ Proteções OWASP implementadas

* Senhas com bcrypt (12 rounds) — nunca texto puro
* Rate limiting — 10 tentativas por IP a cada 15 minutos
* Bloqueio de conta após 5 falhas consecutivas
* Mensagens genéricas — não revela se o e-mail existe
* Anti timing-attack — bcrypt sempre executa, mesmo para e-mails inexistentes
* JWT com expiração de 1 hora
* Helmet — headers de segurança (CSP, HSTS, X-Frame-Options)
* Validação de input em todas as rotas
* Limite de tamanho de payload (10kb) para prevenir DoS