import { exec } from 'child_process';

export class NativePdfTextExtractor {
  async extract(pdfBuffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = exec('pdftotext - -', (error, stdout) => {
        if (error) reject(error);
        else resolve(stdout);
      });
      child.stdin?.end(pdfBuffer);
    });
  }
}
