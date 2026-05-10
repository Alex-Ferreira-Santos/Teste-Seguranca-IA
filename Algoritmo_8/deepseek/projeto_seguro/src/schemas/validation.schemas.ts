import { z } from 'zod';

export const userSchemas = {
  register: z.object({
    email: z.string().email().max(255),
    password: z.string()
      .min(8)
      .max(100)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),

  login: z.object({
    email: z.string().email(),
    password: z.string(),
  }),

  updateUser: z.object({
    email: z.string().email().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string()
      .min(8)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .optional(),
  }),

  updateRoles: z.object({
    roleIds: z.array(z.string().uuid()),
  }),

  userId: z.object({
    id: z.string().uuid(),
  }),
};

export const roleSchemas = {
  createRole: z.object({
    name: z.string().min(3).max(50),
    permissions: z.array(z.string()),
    level: z.number().min(0).max(100),
  }),

  updateRole: z.object({
    name: z.string().min(3).max(50).optional(),
    permissions: z.array(z.string()).optional(),
    level: z.number().min(0).max(100).optional(),
  }),
};