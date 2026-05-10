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
