import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class PdfPort {
  abstract extract(pdfBuffer: Buffer): Promise<{ text: string; numPages: number }>;
  abstract extractFirstPage(pdfBuffer: Buffer): Promise<{ text: string; numPages: number }>;
  abstract extractImages(pdfBuffer: Buffer): Promise<Buffer[]>;
}
