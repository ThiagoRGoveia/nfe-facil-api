import pdfParse from 'pdf-parse/lib/pdf-parse';
import { PdfPort } from '../ports/pdf.port';
import type { Options } from 'pdf-to-img';

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

  async extractImages(pdfBuffer: Buffer): Promise<Buffer[]> {
    try {
      const { pdf } = await import('pdf-to-img');
      // Convert the PDF buffer to images
      // pdf-to-img returns an object with iterable pages
      const options: Options = {
        scale: 2, // Higher resolution for better quality
      };

      const pdfDoc = await pdf(pdfBuffer, options);

      // Collect all page buffers
      const buffers: Buffer[] = [];

      // Get all pages
      for await (const image of pdfDoc) {
        buffers.push(image);
      }

      return buffers;
    } catch (error) {
      throw new Error(`PDF image extraction failed: ${error.message}`);
    }
  }
}
