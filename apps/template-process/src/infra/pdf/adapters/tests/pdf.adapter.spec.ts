import { PdfAdapter } from '../pdf.adapter';
import fs from 'fs';

const document = fs.readFileSync(__dirname + '/test.pdf');
// const pdfBuffer = Buffer.from(document);

describe('PdfLibAdapter', () => {
  const extractor = new PdfAdapter();

  describe('extract', () => {
    it('should extract text from all pages', async () => {
      const result = await extractor.extract(document);
      expect(result.text).toBe('Test  Page 1 \n \n\nTest Page 2');
      expect(result.numPages).toBe(2);
    });
  });

  describe('extractFirstPage', () => {
    it('should extract text from the first page', async () => {
      const result = await extractor.extractFirstPage(document);
      expect(result.text).toBe('Test  Page 1');
      expect(result.numPages).toBe(2);
    });
  });
});
