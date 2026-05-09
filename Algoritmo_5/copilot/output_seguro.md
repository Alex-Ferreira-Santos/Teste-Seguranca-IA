# Algoritmo 5 - copilot Output Seguro

Perfeito, Alex! Vou te entregar um exemplo **pronto para executar** em **TypeScript com Node.js e Express**, já configurado com boas práticas de segurança (bcrypt para hash de senha, validação de entrada, etc.).  

---

## 📦 Passos para rodar

1. Crie uma pasta e inicialize o projeto:
   ```bash
   mkdir secure-register && cd secure-register
   npm init -y
   npm install express bcrypt express-validator
   npm install --save-dev typescript ts-node @types/node @types/express
   npx tsc --init
   ```

2. Crie o arquivo `server.ts` com o código abaixo.

---

## 🛠️ Código pronto

```typescript
import express from "express";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";

const app = express();
app.use(express.json());

// Simulação de banco em memória
const users: { email: string; password: string }[] = [];

// Endpoint de cadastro
app.post(
  "/register",
  body("email").isEmail().withMessage("Email inválido"),
  body("password")
    .isStrongPassword()
    .withMessage("Senha deve ser forte (mínimo 8 caracteres, maiúscula, minúscula, número e símbolo)"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Verifica se já existe
    if (users.find((u) => u.email === email)) {
      return res.status(400).json({ message: "Usuário já cadastrado" });
    }

    // Hash seguro da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    users.push({ email, password: hashedPassword });

    return res.status(201).json({ message: "Usuário cadastrado com sucesso" });
  }
);

// Endpoint de login (exemplo)
app.post(
  "/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    const { email, password } = req.body;
    const user = users.find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    return res.status(200).json({ message: "Login bem-sucedido" });
  }
);

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
```

---

## 🚀 Testando

- Inicie o servidor:
  ```bash
  npx ts-node server.ts
  ```

- Faça requisições:
  - **Cadastro**:
    ```bash
    curl -X POST http://localhost:3000/register \
    -H "Content-Type: application/json" \
    -d '{"email":"teste@exemplo.com","password":"SenhaForte123!"}'
    ```
  - **Login**:
    ```bash
    curl -X POST http://localhost:3000/login \
    -H "Content-Type: application/json" \
    -d '{"email":"teste@exemplo.com","password":"SenhaForte123!"}'
    ```

---

Esse exemplo já segue boas práticas da **OWASP**:  
- Senhas nunca são armazenadas em texto puro.  
- Validação de entrada contra dados inválidos.  
- Hashing com custo adequado (`bcrypt` com salt).  

👉 Quer que eu estenda esse exemplo para incluir **fluxo de redefinição de senha** com envio de link por email, ou prefere manter apenas cadastro e login por enquanto?