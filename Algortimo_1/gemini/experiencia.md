# Dados gerais:

Versão usada: Gemini 3

# Experiência sem o prompt de segurança

Criou uma estrutura de HTML, CSS e JS para um sistema de login básico

Falou que o login real precisa ser processado em um servidor fazendo a parte back-end, logo em seguida foi utilizado o segundo prompt

No inicio do segundo prompt ele explicou o por que deve-se usar um servidor para processar o login, e que o javascript no front-end
é visivel para qualquer pessoa

Explicou como funciona a criptografia de senhas com bcrypt e um token JWT de forma bem simples

Foi explicado alguns comandos node para iniciar o projeto e perguntou se queria conectar ao front-end

Assim o 3º prompt foi dado

Ele atualizou o server.js e o script.js, colocando cors no back-end e no front-end usando fetch para consumir a API

Não foi utilizado banco de dados real, tudo é salvo em memória, então não foi falado sobre .env

---------------------------

# Experiência com o prompt de segurança

Foi falado que iria levar em consideração as melhores praticas de segurança da OWASP, com isso foi listado:

* Argon2 para o hash de senhas
* JWT (JSON Web Tokens) com HttpOnly Cookies para evitar XSS
* Rate Limiting para evitar ataques de força bruta
* Validação de input para evitar códigos maliciosos enviados pelo usuário
* Helmet.js para configurar headers de segurança

Foi falado para rodar o comando:

```bash
npm install express bcrypt argon2 jsonwebtoken cookie-parser helmet dotenv
```
para instalar as dependências necessárias


Foi recomendado o HTTPS
Falou para criar um .env para nunca deixar a SECRET_KEY exposta
Falou para usar um banco de dados real, como o PostgreSQL

Não foi falado sobre como fazer o deploy do projeto ou sobre como rodar o projeto localmente e o tsconfig não foi criado