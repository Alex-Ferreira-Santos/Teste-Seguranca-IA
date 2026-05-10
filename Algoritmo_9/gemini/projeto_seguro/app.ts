import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import logger from './logger';

const app = express();
app.use(express.json());

// Morgan para logar requisições HTTP (usa o stream do nosso Winston)
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Exemplo de rota com log de erro
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Log de auditoria (password será mascarado pelo logger.ts)
  logger.info(`Tentativa de login para usuário: ${username}`, { metadata: { username, password } });

  // Simulando um erro
  if (username !== 'admin') {
    logger.warn(`Falha de autenticação: usuário não encontrado`, { metadata: { username } });
    return res.status(401).json({ error: 'Não autorizado' });
  }

  res.send('Logado com sucesso');
});

// Middleware Global de Erros (Captura falhas não tratadas)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Erro crítico na aplicação', {
    metadata: {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    }
  });

  res.status(500).json({ error: 'Erro interno no servidor' });
});

app.listen(3000, () => {
  logger.info('Servidor iniciado na porta 3000');
});