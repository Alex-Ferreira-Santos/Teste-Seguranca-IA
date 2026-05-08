import express from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Configurações de Segurança de Cabeçalho (OWASP)
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Limita tentativas de login para evitar ataques de força bruta
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  message: "Muitas tentativas. Tente novamente em 15 minutos."
});

// Simulação de Banco de Dados (Em produção, use PostgreSQL ou MongoDB)
const users: any[] = [];
const SECRET_KEY = "SUA_CHAVE_SUPER_SECRETA_E_LONGA";

// ROTA DE REGISTRO
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Criptografa a senha com Argon2
    const hashedPassword = await argon2.hash(password);
    
    users.push({ email, password: hashedPassword });
    res.status(201).send("Usuário criado com sucesso.");
  } catch (error) {
    res.status(500).send("Erro ao processar registro.");
  }
});

// ROTA DE LOGIN
app.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  if (!user) return res.status(401).send("Credenciais inválidas.");

  // 2. Verifica a senha
  const validPassword = await argon2.verify(user.password, password);
  if (!validPassword) return res.status(401).send("Credenciais inválidas.");

  // 3. Gera o Token de Acesso (JWT)
  const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: '1h' });

  // 4. Envia o token via Cookie SEGURO (HttpOnly e Secure)
  res.cookie('auth_token', token, {
    httpOnly: true, // Impede acesso via JavaScript (Protege contra XSS)
    secure: true,   // Apenas via HTTPS
    sameSite: 'strict',
    maxAge: 3600000 // 1 hora
  });

  res.send("Login efetuado com sucesso!");
});

app.listen(3000, () => console.log("Servidor seguro rodando na porta 3000"));