import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

// ─── REGRAS DE SENHA SEGURA ──────────────────────────────────────────────────
// OWASP recomenda senhas de ao menos 8 caracteres com complexidade
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128; // Limite para evitar bcrypt DoS

function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    errors.push('Senha é obrigatória.');
    return errors;
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`);
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Senha muito longa.`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter ao menos uma letra maiúscula.');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter ao menos uma letra minúscula.');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter ao menos um número.');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Senha deve conter ao menos um caractere especial (!@#$%...).');
  }

  return errors;
}

// ─── MIDDLEWARE DE VALIDAÇÃO PARA REGISTRO ────────────────────────────────────
export function validateRegister(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;

  // Validar e sanitizar e-mail
  if (!email || typeof email !== 'string' || !validator.isEmail(email.trim())) {
    res.status(400).json({ error: 'E-mail inválido.' });
    return;
  }

  if (email.length > 254) { // RFC 5321 max length
    res.status(400).json({ error: 'E-mail muito longo.' });
    return;
  }

  // Validar senha
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    res.status(400).json({ error: passwordErrors[0], details: passwordErrors });
    return;
  }

  next();
}

// ─── MIDDLEWARE DE VALIDAÇÃO PARA LOGIN ───────────────────────────────────────
export function validateLogin(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !validator.isEmail(email.trim())) {
    res.status(400).json({ error: 'E-mail ou senha inválidos.' }); // Mensagem genérica
    return;
  }

  if (!password || typeof password !== 'string' || password.length > PASSWORD_MAX_LENGTH) {
    res.status(400).json({ error: 'E-mail ou senha inválidos.' }); // Mensagem genérica
    return;
  }

  next();
}