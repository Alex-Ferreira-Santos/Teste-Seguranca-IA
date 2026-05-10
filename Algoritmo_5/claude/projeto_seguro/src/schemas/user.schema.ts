import { z } from 'zod';

// OWASP A03 – Validação estrita de entrada com Zod
export const inviteUserSchema = z.object({
  email: z
    .string()
    .email('E-mail inválido')
    .max(254, 'E-mail muito longo') // RFC 5321
    .toLowerCase()
    .trim(),
  name: z
    .string()
    .min(2, 'Nome muito curto')
    .max(100, 'Nome muito longo')
    .regex(/^[\p{L}\p{M} '-]+$/u, 'Nome contém caracteres inválidos') // Unicode seguro
    .trim(),
  role: z.enum(['admin', 'editor', 'viewer']).default('viewer'),
});

export const setPasswordSchema = z.object({
  token: z
    .string()
    .min(10, 'Token inválido')
    .max(2048, 'Token inválido'),
  password: z
    .string()
    .min(12, 'A senha deve ter no mínimo 12 caracteres')
    .max(128, 'Senha muito longa')
    // Exige ao menos 1 letra maiúscula, 1 minúscula, 1 número e 1 símbolo
    .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Deve conter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Deve conter ao menos um número')
    .regex(/[^A-Za-z0-9]/, 'Deve conter ao menos um caractere especial'),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;