import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class PdfTextExtractorPort {
  abstract extract(pdfBuffer: Buffer): Promise<string>;
}
