import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../types';

/**
 * Middleware de validação genérico com Zod.
 * NUNCA usa eval(), JSON.parse() sem schema, ou deserialização de objetos arbitrários.
 * Toda entrada é validada e transformada antes de ser usada.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Limite de tamanho do payload já tratado pelo express.json({ limit })
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Retorna erros de validação formatados, mas sem revelar internals (OWASP A05)
      const issues = formatZodErrors(result.error);
      res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: issues,  // safe — gerado pelo Zod, não reflete stack interno
      } satisfies ApiResponse);
      return;
    }

    // Substitui req.body pelo objeto validado e transformado
    req.body = result.data;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Parâmetro inválido',
      } satisfies ApiResponse);
      return;
    }

    req.params = result.data as Record<string, string>;
    next();
  };
}

function formatZodErrors(error: ZodError): Record<string, string> {
  return error.errors.reduce<Record<string, string>>((acc, issue) => {
    const path = issue.path.join('.');
    acc[path || '_root'] = issue.message;
    return acc;
  }, {});
}