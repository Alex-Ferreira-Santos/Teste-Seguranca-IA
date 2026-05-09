// security-utils.ts - Utilitários adicionais de segurança
import crypto from 'crypto';
import { createReadStream } from 'fs';
import { spawn } from 'child_process';

// Função para scan com antivírus (ClamAV)
export const scanWithAntivirus = async (filePath: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const clamscan = spawn('clamscan', ['--no-summary', '--stdout', filePath]);
    
    let output = '';
    clamscan.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    clamscan.on('close', (code) => {
      if (code === 0 && !output.includes('FOUND')) {
        resolve(true);
      } else {
        reject(new Error('Vírus detectado ou erro no scan'));
      }
    });
    
    clamscan.on('error', reject);
  });
};

// Validação de conteúdo XSS
export const validateXSSContent = (content: Buffer, mimeType: string): boolean => {
  if (mimeType === 'text/plain') {
    const text = content.toString('utf8');
    // Regex básico para detectar tags HTML/script
    const xssPattern = /<script|javascript:|onerror=|onload=/i;
    return !xssPattern.test(text);
  }
  return true;
};

// Gerar URLs assinadas
export const generateSignedUrl = (fileId: string, expiresInSeconds: number): string => {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const signature = crypto
    .createHmac('sha256', process.env.SIGNING_SECRET || 'super-secret-key-please-change')
    .update(`${fileId}:${expiresAt}`)
    .digest('hex');
  
  return `/api/file/${fileId}?expires=${expiresAt}&signature=${signature}`;
};