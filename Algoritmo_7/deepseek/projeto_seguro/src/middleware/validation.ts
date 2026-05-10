// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { URLValidator } from '../services/URLValidator.js';

const webhookRegistrationSchema = z.object({
  url: z.string().url(),
  eventType: z.enum(['task_completed', 'payment_received', 'user_signed_up']),
  timeout: z.number().min(1000).max(30000).optional()
});

export async function validateWebhookRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = webhookRegistrationSchema.parse(req.body);
    
    // Additional URL validation (async DNS check)
    const sanitizedUrl = await URLValidator.validateAndSanitize(validated.url);
    req.body.url = sanitizedUrl;
    req.body.eventType = validated.eventType;
    req.body.timeout = validated.timeout || 5000;
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    } else if (error instanceof Error) {
      res.status(400).json({
        error: error.message
      });
    } else {
      res.status(400).json({
        error: 'Invalid request'
      });
    }
  }
}

export function validateApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    res.status(401).json({ error: 'Invalid or missing API key' });
    return;
  }
  
  next();
}