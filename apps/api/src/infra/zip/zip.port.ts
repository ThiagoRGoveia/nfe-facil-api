import { Injectable } from '@nestjs/common';

export interface ZipFile {
  name: string;
  content: Buffer;
}

export interface ExtractedFile {
  name: string;
  content: Buffer;
  path: string;
}

@Injectable()
export abstract class ZipPort {
  abstract extractFiles(zipFile: Buffer): Promise<ExtractedFile[]>;
}
