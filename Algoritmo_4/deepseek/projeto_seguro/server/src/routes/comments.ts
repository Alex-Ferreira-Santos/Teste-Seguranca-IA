import express from 'express';
import { body } from 'express-validator';
import { preventXSS } from '../middleware/security';
import { validateComment, handleValidationErrors, commentRateLimiter } from '../middleware/validation';
import { run, get } from '../database';
import xss from 'xss';

const router = express.Router();

// Rota POST - Salvar comentário
router.post(
  '/',
  commentRateLimiter,
  preventXSS,
  validateComment,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, email, content } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';

      // Verificar spam (comentários muito rápidos)
      const lastComment = await get(
        'SELECT created_at FROM comments WHERE ip_address = ? ORDER BY created_at DESC LIMIT 1',
        [ip]
      );

      if (lastComment) {
        const lastCommentTime = new Date(lastComment.created_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastCommentTime.getTime()) / 1000 / 60;
        
        if (diffMinutes < 2) {
          return res.status(429).json({ 
            error: 'Aguarde 2 minutos entre os comentários' 
          });
        }
      }

      // Inserir comentário (não aprovado automaticamente)
      const result = await run(
        `INSERT INTO comments (name, email, content, ip_address, user_agent, status) 
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [name, email, content, ip, userAgent]
      );

      // Log de segurança (em produção, enviar para sistema de log)
      console.log(`[SECURITY] Novo comentário de ${email} (IP: ${ip})`);

      res.status(201).json({
        success: true,
        message: 'Comentário enviado com sucesso. Aguardando moderação.',
        commentId: result.lastID
      });
    } catch (error) {
      console.error('Erro ao salvar comentário:', error);
      res.status(500).json({ 
        error: 'Erro interno ao processar comentário' 
      });
    }
  }
);

// Rota GET - Listar comentários aprovados
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    // Buscar apenas comentários aprovados
    const comments = await get(
      `SELECT id, name, content, created_at 
       FROM comments 
       WHERE status = 'approved' 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const total = await get(
      'SELECT COUNT(*) as count FROM comments WHERE status = "approved"'
    );

    res.json({
      comments,
      pagination: {
        page,
        limit,
        total: total.count,
        pages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar comentários:', error);
    res.status(500).json({ error: 'Erro ao carregar comentários' });
  }
});

export default router;