import * as crypto from 'crypto';

export class LogEncryption {
  private algorithm = 'aes-256-gcm' as const;
  private key: Buffer;

  constructor() {
    const encryptionKey = process.env.LOG_ENCRYPTION_KEY;
    if (!encryptionKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('LOG_ENCRYPTION_KEY is required in production');
      }
      console.warn('Warning: LOG_ENCRYPTION_KEY not set, using development key');
      this.key = crypto.createHash('sha256').update('development-key-12345').digest();
    } else {
      if (encryptionKey.length === 64) {
        this.key = Buffer.from(encryptionKey, 'hex');
      } else {
        this.key = crypto.createHash('sha256').update(encryptionKey).digest();
      }
    }
  }

  encryptSensitiveFields<T extends { stackTrace?: string }>(entry: T): T {
    if (!entry.stackTrace) {
      return entry;
    }

    try {
      const encrypted = this.encrypt(entry.stackTrace);
      return {
        ...entry,
        stackTrace: `ENCRYPTED:${encrypted.encryptedData}:${encrypted.iv}:${encrypted.authTag}`
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      return {
        ...entry,
        stackTrace: '[ENCRYPTION_FAILED]'
      };
    }
  }

  decrypt(encryptedData: string): string {
    if (!encryptedData.startsWith('ENCRYPTED:')) {
      return encryptedData;
    }

    try {
      const parts = encryptedData.substring(10).split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
      }

      const [data, ivHex, authTagHex] = parts;
      return this.decryptData(data, ivHex, authTagHex);
    } catch (error) {
      console.error('Decryption failed:', error);
      return '[DECRYPTION_FAILED]';
    }
  }

  private encrypt(text: string): { encryptedData: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  private decryptData(encryptedData: string, ivHex: string, authTagHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}