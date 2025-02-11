import * as pdfParse from 'pdf-parse';
import { PdfPort } from '../ports/pdf.port';

export class PdfAdapter implements PdfPort {
  async extract(pdfBuffer: Buffer): Promise<{ text: string; numPages: number }> {
    try {
      const data = await pdfParse(pdfBuffer);
      return { text: data.text.trim(), numPages: data.numpages };
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  async extractFirstPage(pdfBuffer: Buffer): Promise<{ text: string; numPages: number }> {
    const data = await pdfParse(pdfBuffer, { max: 1 });
    return { text: data.text.trim(), numPages: data.numpages };
  }
}
