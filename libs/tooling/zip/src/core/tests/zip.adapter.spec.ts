import fs from 'fs/promises';
import path from 'path';
import { ZipAdapter } from '../adapters/zip.adapter';

describe('ZipAdapter', () => {
  let adapter: ZipAdapter;

  beforeEach(() => {
    adapter = new ZipAdapter();
  });

  describe('extractFiles', () => {
    it('should extract files from a zip buffer', async () => {
      // Create a test zip file with content
      const testFilePath = path.join(__dirname, 'test-files', 'test.zip');
      const zipBuffer = await fs.readFile(testFilePath);

      const result = await adapter.extractFiles(zipBuffer);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);

      const firstFile = result[0];
      expect(firstFile).toHaveProperty('name');
      expect(firstFile).toHaveProperty('path');
      expect(firstFile).toHaveProperty('content');
      expect(Buffer.isBuffer(firstFile.content)).toBeTruthy();
    });
  });
});
