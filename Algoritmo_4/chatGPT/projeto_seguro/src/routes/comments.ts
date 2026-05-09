import { Router, Request, Response } from "express";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";

const router = Router();

type Comment = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

const comments: Comment[] = [];

const createCommentSchema = z.object({
  name: z.string()
    .min(2)
    .max(50),

  message: z.string()
    .min(3)
    .max(500),
});

router.post("/", async (req: Request, res: Response) => {

  const validation = createCommentSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: "Dados inválidos"
    });
  }

  const sanitizedName = sanitizeHtml(validation.data.name, {
    allowedTags: [],
    allowedAttributes: {}
  });

  const sanitizedMessage = sanitizeHtml(validation.data.message, {
    allowedTags: [],
    allowedAttributes: {}
  });

  const comment: Comment = {
    id: crypto.randomUUID(),
    name: sanitizedName,
    message: sanitizedMessage,
    createdAt: new Date().toISOString()
  };

  comments.push(comment);

  return res.status(201).json({
    success: true,
    comment
  });
});

router.get("/", async (_req: Request, res: Response) => {

  return res.json({
    comments
  });
});

export default router;