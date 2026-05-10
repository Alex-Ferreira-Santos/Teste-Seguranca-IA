import { Router, Request, Response } from 'express';
import { requireAuth, progressRateLimiter, readRateLimiter } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { saveProgressSchema, formIdParamSchema } from '../validators/formProgress.schema';
import {
  saveFormProgress,
  getFormProgress,
  deleteFormProgress,
} from '../services/formProgress.service';

const router = Router();

// Todos os endpoints exigem autenticação
router.use(requireAuth);

/**
 * PUT /api/form-progress/:formId
 * Salva ou atualiza o progresso do formulário para o usuário autenticado.
 */
router.put(
  '/:formId',
  progressRateLimiter,
  validateParams(formIdParamSchema),
  validateBody(saveProgressSchema),
  async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;

    // Garante que o formId do body bate com o da URL — evita inconsistências
    if (req.body.formId !== req.params.formId) {
      res.status(400).json({ success: false, error: 'formId inconsistente.' });
      return;
    }

    const result = await saveFormProgress(userId, req.body);

    res.status(result.success ? 200 : 500).json(result);
  }
);

/**
 * GET /api/form-progress/:formId
 * Recupera o progresso salvo do formulário para o usuário autenticado.
 */
router.get(
  '/:formId',
  readRateLimiter,
  validateParams(formIdParamSchema),
  async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { formId } = req.params;

    const result = await getFormProgress(userId, formId);

    res.status(result.success ? 200 : 500).json(result);
  }
);

/**
 * DELETE /api/form-progress/:formId
 * Remove o progresso salvo (GDPR / direito ao esquecimento).
 */
router.delete(
  '/:formId',
  progressRateLimiter,
  validateParams(formIdParamSchema),
  async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { formId } = req.params;

    const result = await deleteFormProgress(userId, formId);

    res.status(result.success ? 200 : 500).json(result);
  }
);

export default router;