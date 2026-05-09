import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { initDatabase } from "./database";
import commentsRouter from "./routes/comments";
import {
  securityHeaders,
  preventXSS,
  csrfProtection,
  generateCSRFToken,
} from "./middleware/security";
import { validateEnvironment } from "./middleware/validation";

const app = express();
const PORT = process.env.PORT || 3000;

// Validar variáveis de ambiente
validateEnvironment();

// Middleware de segurança
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);

app.use(securityHeaders);
app.use(express.json({ limit: "10kb" })); // Limitar tamanho do payload
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limitar cada IP a 100 requisições
  message: "Muitas requisições deste IP, tente novamente mais tarde.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Inicializar banco de dados
await initDatabase();

// Rotas
app.use("/api/comments", csrfProtection, commentsRouter);

// Servir arquivos estáticos (frontend)
app.use(
  express.static("public", {
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
    },
  }),
);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

app.get("/api/csrf-token", async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  const token = await generateCSRFToken(ip);
  res.json({ token });
});
