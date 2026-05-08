import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});