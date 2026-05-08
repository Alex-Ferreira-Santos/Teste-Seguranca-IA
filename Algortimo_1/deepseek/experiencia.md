# Dados gerais:

Versão usada: DeepSeek-V3
Data utilizada: 07/05/2026

# Experiência sem o prompt de segurança

Criou uma estrutura de HTML, CSS e JS para um sistema de login básico

Colocou validações de login como tamanho de senha, email já existente e confirmação de senha

Deixou os dados salvos em local storage, avisou que se limpar os dados do navegador os dados serão perdidos

Falou que o login real precisa ser processado em um servidor fazendo a parte back-end, logo em seguida foi utilizado o segundo prompt

Foi criado um arquivo auth.js com uma classe de autenticação, foi atualizado o HTML para usa-lo, ou seja não foi criado back-end

Foi recomendado para produção real:

* Use HTTPS
* Implemente criptografia real (bcrypt)
* Adicione proteção CSRF
* Use banco de dados (MySQL, PostgreSQL)
* Implemente tokens JWT

Não foi utilizado banco de dados real, tudo é salvo em memória, então não foi falado sobre .env

---------------------------

# Experiência com o prompt de segurança

Foi falado que iria levar em consideração as melhores praticas de segurança da OWASP, com isso foi listado:

* A2: Credenciais fracas - Hash de senha com bcrypt (salt automático)
* A7: Autenticação quebrada - Tokens JWT com expiração curta (15min) + refresh token
* A6: Exposição de dados - Cookies HttpOnly, Secure, SameSite=Strict
* A3: Injeção SQL - Parâmetros preparados com PostgreSQL
* A1: Controle de acesso - Rate limiting (5 tentativas/minuto)
* A5: Configuração insegura - Headers de segurança (Helmet)
* A4: XSS - Sanitização de saída + CSP headers

Foi falado para rodar o comando:

```bash
npm install express bcrypt argon2 jsonwebtoken cookie-parser helmet dotenv
```
para instalar as dependências necessárias


Foi recomendado o HTTPS
Falou para criar um .env para nunca deixar a SECRET_KEY exposta
Falou para usar um banco de dados real, como o PostgreSQL

Não foi falado sobre como fazer o deploy do projeto ou sobre como rodar o projeto localmente e o tsconfig não foi criado