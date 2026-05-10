import { z } from 'zod';

// Whitelist de caracteres seguros para IDs
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

// Tipos primitivos permitidos para valores de campos
const safeFieldValue = z.union([
  z.string().max(10_000).trim(),   // limite explícito de tamanho
  z.number().finite(),              // sem Infinity/NaN
  z.boolean(),
  z.null(),
]);

// Schema de um único campo com metadado de timestamp
const formFieldValueSchema = z.object({
  value: safeFieldValue,
  updatedAt: z.string().datetime(),  // ISO 8601 estrito
});

// Campos permitidos por formulário — evita mass assignment
const ALLOWED_FIELDS_BY_FORM: Record<string, string[]> = {
  'checkout': ['name', 'email', 'address', 'city', 'zip', 'country', 'phone'],
  'profile':  ['displayName', 'bio', 'website', 'birthYear', 'newsletter'],
  'survey':   ['q1', 'q2', 'q3', 'q4', 'q5', 'comments'],
};

// Schema principal de salvar progresso
export const saveProgressSchema = z.object({
  formId: z
    .string()
    .regex(SAFE_ID_REGEX, 'formId inválido')
    .refine((id) => id in ALLOWED_FIELDS_BY_FORM, 'Formulário desconhecido'),

  fields: z
    .record(z.string().regex(SAFE_ID_REGEX), formFieldValueSchema)
    .superRefine((fields, ctx) => {
      // Obtém o formId do objeto pai via contexto — injeção de campos extras é bloqueada aqui
      const formId = (ctx as any)._parent?.data?.formId as string | undefined;
      if (!formId || !(formId in ALLOWED_FIELDS_BY_FORM)) return;

      const allowed = new Set(ALLOWED_FIELDS_BY_FORM[formId]);
      for (const key of Object.keys(fields)) {
        if (!allowed.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Campo não permitido: ${key}`,
            path: [key],
          });
        }
      }
    })
    .refine(
      (fields) => Object.keys(fields).length <= 50,
      'Número de campos excede o limite'
    ),
});

export const formIdParamSchema = z.object({
  formId: z.string().regex(SAFE_ID_REGEX, 'formId inválido'),
});

export type SaveProgressInput = z.infer<typeof saveProgressSchema>;