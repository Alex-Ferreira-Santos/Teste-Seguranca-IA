import express from "express";
import helmet from "helmet";
import cors from "cors";
import filesRoutes from "./routes/files.routes";

const app = express();

app.use(helmet());

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST"]
}));

app.use(express.json());

app.use("/api", filesRoutes);

app.use((err: any, _req: any, res: any, _next: any) => {
  if (err.message?.includes("File too large")) {
    return res.status(400).json({
      error: "Arquivo excede tamanho máximo"
    });
  }

  return res.status(400).json({
    error: err.message || "Erro interno"
  });
});

const PORT = 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});