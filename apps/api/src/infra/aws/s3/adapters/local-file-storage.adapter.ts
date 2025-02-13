import { Readable } from 'stream';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { FileStoragePort } from '../ports/file-storage.port';

// NOTICE: This is a test adapter, it is not used in production
export class LocalFileStorageAdapter extends FileStoragePort {
  async uploadFromStream(key: string, stream: Readable): Promise<string> {
    const filePath = path.join(process.cwd(), '/test-files', key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const writeStream = createWriteStream(filePath);
    stream.pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        resolve(filePath);
      });
      writeStream.on('error', reject);
    });

    return filePath;
  }

  async uploadFromBuffer(key: string, buffer: Buffer): Promise<string> {
    const filePath = path.join(process.cwd(), '/test-files', key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  get(pathString: string): Promise<Readable> {
    const filePath = path.join('/test-files', pathString);
    return Promise.resolve(createReadStream(filePath));
  }

  async delete(pathString: string): Promise<void> {
    const filePath = path.join('/test-files', pathString);
    await fs.unlink(filePath);
  }

  async deleteFolder(pathString: string): Promise<void> {
    const folderPath = path.join('/test-files', pathString);
    await fs.rm(folderPath, { recursive: true, force: true });
  }
}
