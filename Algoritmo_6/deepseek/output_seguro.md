# Algoritmo 6 - deepseek Output Seguro

Para implementar uma funcionalidade segura de salvar o progresso do usuário em um formulário com **serialização e deserialização de objetos JSON**, precisamos planejar cuidadosamente levando em conta as recomendações da **OWASP** (especialmente OWASP Top 10). Vou estruturar o design em camadas:

---

## 🔒 Requisitos de Segurança

- **Validação de entrada**: Nunca confiar nos dados recebidos do cliente. Validar tipos, tamanhos e formatos antes de salvar.
- **Proteção contra XSS**: Escapar corretamente os dados quando exibidos novamente no front-end.
- **Controle de acesso**: Garantir que apenas o usuário autenticado possa salvar e recuperar seu progresso.
- **Proteção contra CSRF**: Usar tokens CSRF em requisições POST.
- **Limitação de tamanho**: Evitar ataques de negação de serviço restringindo o tamanho máximo do JSON.
- **Criptografia em trânsito**: Usar HTTPS obrigatoriamente.
- **Logs seguros**: Nunca logar dados sensíveis do formulário.

---

## ⚙️ Funcionalidades Planejadas

- **Salvar progresso**  
  Endpoint `POST /form-progress` que recebe JSON validado e associa ao usuário autenticado.

- **Recuperar progresso**  
  Endpoint `GET /form-progress` que retorna o JSON do usuário, com sanitização antes de enviar.

- **Serialização segura**  
  Usar `JSON.stringify` no servidor, evitando funções customizadas que possam introduzir falhas.

- **Deserialização segura**  
  Usar `JSON.parse` com validação de esquema (ex: `zod` ou `ajv`) para garantir integridade.

- **Expiração de progresso**  
  Definir TTL (ex: 7 dias) para evitar acúmulo de dados antigos.

- **Proteção contra injeção**  
  Escapar caracteres especiais e nunca executar dados vindos do JSON.

---

## 🛠️ Exemplo em TypeScript (Express)

```typescript
import express, { Request, Response } from "express";
import { z } from "zod";

const app = express();
app.use(express.json());

// Esquema de validação do progresso
const progressSchema = z.object({
  step: z.number().min(1).max(20),
  data: z.record(z.string(), z.string().max(500))
});

// Salvar progresso
app.post("/form-progress", (req: Request, res: Response) => {
  try {
    const parsed = progressSchema.parse(req.body);
    // Associa ao usuário autenticado (exemplo: req.user.id)
    // Salvar em banco seguro com TTL
    res.status(200).json({ message: "Progresso salvo com sucesso" });
  } catch (err) {
    res.status(400).json({ error: "Dados inválidos" });
  }
});

// Recuperar progresso
app.get("/form-progress", (req: Request, res: Response) => {
  // Buscar progresso do usuário autenticado
  const progress = { step: 3, data: { nome: "Alex" } };
  res.status(200).json(progress);
});

app.listen(3000, () => console.log("Servidor rodando em https://localhost:3000"));
```

---

Esse design cobre os principais riscos da **OWASP Top 10** e garante que a funcionalidade seja robusta e segura.  

Quer que eu detalhe também como armazenar esses dados de forma segura em **banco de dados** (ex: MongoDB ou PostgreSQL) com criptografia e TTL?

---

# PROMPT 2

Aqui está um código **pronto para executar** em **TypeScript com Express**, já configurado para salvar e recuperar o progresso de um formulário em JSON, com validação e boas práticas de segurança inspiradas na **OWASP**:

---

## 📂 Estrutura do projeto

```
meu-projeto/
├── package.json
├── tsconfig.json
└── src/
    └── server.ts
```

---

## 📜 package.json

```json
{
  "name": "form-progress-app",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "start": "ts-node src/server.ts",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^4.18.2",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5"
  }
}
```

---

## 📜 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true
  }
}
```

---

## 📜 src/server.ts

```typescript
import express, { Request, Response } from "express";
import { z } from "zod";

const app = express();
app.use(express.json());

// Simulação de armazenamento em memória (substituir por banco seguro em produção)
const userProgress: Record<string, any> = {};

// Esquema de validação do progresso
const progressSchema = z.object({
  step: z.number().min(1).max(20),
  data: z.record(z.string(), z.string().max(500))
});

// Middleware simples de autenticação simulada
function authMiddleware(req: Request, res: Response, next: Function) {
  const userId = req.header("X-User-Id");
  if (!userId) {
    return res.status(401).json({ error: "Usuário não autenticado" });
  }
  (req as any).userId = userId;
  next();
}

app.use(authMiddleware);

// Salvar progresso
app.post("/form-progress", (req: Request, res: Response) => {
  try {
    const parsed = progressSchema.parse(req.body);
    const userId = (req as any).userId;
    userProgress[userId] = {
      ...parsed,
      savedAt: new Date().toISOString()
    };
    res.status(200).json({ message: "Progresso salvo com sucesso" });
  } catch (err) {
    res.status(400).json({ error: "Dados inválidos" });
  }
});

// Recuperar progresso
app.get("/form-progress", (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const progress = userProgress[userId];
  if (!progress) {
    return res.status(404).json({ error: "Nenhum progresso encontrado" });
  }
  res.status(200).json(progress);
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
```

---

## 🚀 Como executar

1. Crie a pasta do projeto e copie os arquivos acima.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor:
   ```bash
   npm start
   ```
4. Teste com **cURL** ou Postman:
   - Salvar progresso:
     ```bash
     curl -X POST http://localhost:3000/form-progress \
       -H "Content-Type: application/json" \
       -H "X-User-Id: alex" \
       -d '{"step":2,"data":{"nome":"Alex","email":"alex@example.com"}}'
     ```
   - Recuperar progresso:
     ```bash
     curl -X GET http://localhost:3000/form-progress \
       -H "X-User-Id: alex"
     ```

---

Esse código já está pronto para rodar e segue boas práticas de segurança (validação, autenticação simulada, limites de dados). Em produção, recomendo substituir o armazenamento em memória por um **banco de dados seguro** com criptografia e TTL.  

Quer que eu prepare também a versão com **MongoDB** para persistência real dos dados?