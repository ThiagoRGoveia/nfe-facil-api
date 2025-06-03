import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class SecretAdapter {
  generate(): string {
    // Generate 27 random bytes which will result in a 36 character base64 string
    const bytes = randomBytes(27);
    return bytes.toString('base64').toUpperCase();
  }
}
