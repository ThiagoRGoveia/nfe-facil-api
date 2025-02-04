import { Injectable } from '@nestjs/common';
import { EncryptionPort } from '../ports/encryption.port';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionAdapter implements EncryptionPort {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor() {
    this.key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-secret', 'salt', 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(text: string): string {
    const [ivHex, encrypted] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
