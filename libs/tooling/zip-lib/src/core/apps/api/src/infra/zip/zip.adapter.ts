import { Injectable } from '@nestjs/common';
import { ZipPort, ExtractedFile } from './zip.port';
import unzipper from 'unzipper';

@Injectable()
export class ZipAdapter implements ZipPort {
  async extractFiles(zipFile: Buffer): Promise<ExtractedFile[]> {
    const files: ExtractedFile[] = [];

    const directory = await unzipper.Open.buffer(zipFile);

    for (const file of directory.files) {
      if (!file.type.includes('Directory')) {
        const content = await file.buffer();
        files.push({
          name: file.path.split('/').pop() || '',
          path: file.path,
          content,
        });
      }
    }

    return files;
  }
}
