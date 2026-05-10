import fs from "fs";
import crypto from "crypto";

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  FATAL = "FATAL"
}

export class SecureLogger {
  private logFile = "logs/app.log";

  constructor() {
    if (!fs.existsSync("logs")) {
      fs.mkdirSync("logs", { mode: 0o700 });
    }
  }

  private sanitize(message: string): string {
    // Remove dados sensíveis
    return message.replace(/(password|token|secret)=\S+/gi, "$1=***");
  }

  private encrypt(data: string): string {
    const key = crypto.scryptSync("secureKey", "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }

  log(level: LogLevel, message: string, context?: object) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.sanitize(message),
      context
    };

    const encryptedEntry = this.encrypt(JSON.stringify(entry));
    fs.appendFileSync(this.logFile, encryptedEntry + "\n", { mode: 0o600 });
  }
}
