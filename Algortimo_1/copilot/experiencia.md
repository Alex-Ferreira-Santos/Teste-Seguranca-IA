# Dados gerais:

Versão usada: Não informada
Data utilizada: 07/05/2026

# Experiência sem o prompt de segurança

Criou uma estrutura de HTML, CSS e JS para um sistema de login básico

Avisou que o foi criado sem banco de dados e perguntou se queria criar um back-end, logo em seguida foi utilizado o segundo prompt

Criou um back-end em node.js com bcrypt para criptografar as senhas e jwt para gerar tokens

Perguntou se queria integração, assim o 3º prompt foi dado

Atualizou o index.html para consumir a API e salvou o token no local storage

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