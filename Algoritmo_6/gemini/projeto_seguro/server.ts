import express, { Request, Response } from 'express';
import { z } from 'zod';
import cors from 'cors';

const app = express();
const PORT = 3000;

// Middleware de Segurança
app.use(cors()); // Configure adequadamente para produção
app.use(express.json({ limit: '10kb' })); // Proteção contra payloads gigantes (DoS)

// --- SCHEMA DE VALIDAÇÃO (O coração da segurança) ---
// Isso impede Injeção de Objetos e garante integridade
const FormProgressSchema = z.object({
  userId: z.string().uuid(), // Garante que o ID seja um UUID válido
  currentStep: z.number().int().min(1).max(5),
  formData: z.object({
    fullName: z.string().min(2).max(100).trim(),
    email: z.string().email().toLowerCase(),
    bio: z.string().max(500).optional(),
  }),
  isComplete: z.boolean().default(false),
  timestamp: z.string().datetime()
}).strict(); // Rejeita qualquer propriedade extra não definida

// --- ENDPOINTS ---

// Simulação de banco de dados em memória
const db_mock = new Map<string, any>();

app.post('/save', (req: Request, res: Response) => {
  try {
    // DESERIALIZAÇÃO SEGURA: 
    // O .parse() valida o JSON e remove lixo/scripts injetados
    const validatedData = FormProgressSchema.parse(req.body);

    // Salvando de forma segura
    db_mock.set(validatedData.userId, validatedData);

    console.log(`[Segurança] Dados salvos com sucesso para o usuário: ${validatedData.userId}`);
    
    res.status(200).json({ 
      status: "success", 
      message: "Progresso salvo com segurança." 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Erro de validação: Retornamos o que está errado sem expor detalhes do servidor
      res.status(400).json({ 
        status: "error", 
        errors: error.errors.map(e => ({ path: e.path, message: e.message })) 
      });
    } else {
      res.status(500).json({ status: "error", message: "Erro interno do servidor." });
    }
  }
});

app.get('/load/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  
  // Validação simples do parâmetro de URL para evitar ataques de path traversal ou injeção
  if (!z.string().uuid().safeParse(userId).success) {
    return res.status(400).json({ message: "ID de usuário inválido." });
  }

  const data = db_mock.get(userId);
  if (!data) return res.status(404).json({ message: "Nenhum progresso encontrado." });

  res.json(data);
});

app.listen(PORT, () => {
  console.log(`🛡️ Servidor de Segurança Ativo: http://localhost:${PORT}`);
});