import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { userRoutes } from './routes/users';

const app = express();

// OWASP A05 – Segurança de configuração
app.use(helmet()); // headers de segurança
app.use(express.json({ limit: '10kb' })); // evita payloads gigantes

// OWASP A07 – Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
});
app.use(globalLimiter);

app.use('/api/users', userRoutes);

// Não vaza stack trace em produção (OWASP A09)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message); // Nunca loga senha ou token completo
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));