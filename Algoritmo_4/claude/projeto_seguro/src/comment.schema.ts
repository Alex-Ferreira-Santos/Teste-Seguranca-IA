import { z } from 'zod';

export const CommentSchema = z.object({
  author_name: z
    .string({ required_error: 'Nome obrigatório.' })
    .min(2,  'Nome muito curto (mín. 2 caracteres).')
    .max(80, 'Nome excede 80 caracteres.')
    .regex(/^[\p{L}\p{N} '\-\.]+$/u, 'Nome contém caracteres inválidos.'),

  author_email: z
    .string({ required_error: 'E-mail obrigatório.' })
    .email('E-mail inválido.')
    .max(254, 'E-mail excede 254 caracteres.')
    .transform(v => v.toLowerCase()),

  body: z
    .string({ required_error: 'Comentário obrigatório.' })
    .min(5,    'Comentário muito curto (mín. 5 caracteres).')
    .max(2000, 'Comentário excede 2000 caracteres.'),

  page_id: z
    .string()
    .max(500, 'page_id inválido.')
    .default('/'),

  /* Honeypot — humanos deixam vazio, bots preenchem */
  website: z.string().max(0, 'Bot detectado.').optional(),
});

export type CommentInput = z.infer<typeof CommentSchema>;
