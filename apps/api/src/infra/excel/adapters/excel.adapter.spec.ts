import { ExcelJsAdapter } from './excel.adapter';
import { Workbook, Buffer as ExcelJsBuffer } from 'exceljs';
import { Readable } from 'stream';

describe('ExcelAdapter', () => {
  let adapter: ExcelJsAdapter;

  beforeEach(() => {
    adapter = new ExcelJsAdapter();
  });

  describe('convertToExcel', () => {
    it('should create an empty Excel file when no data is provided', async () => {
      const buffer = await adapter.convertToExcel([]);
      const workbook = new Workbook();
      await workbook.xlsx.load(buffer as unknown as ExcelJsBuffer);
      const worksheet = workbook.getWorksheet('Sheet1');

      expect(worksheet).toBeDefined();
      expect(worksheet?.rowCount).toBe(0);
    });

    it('should convert simple data to Excel format', async () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const buffer = await adapter.convertToExcel(data);

      const workbook = new Workbook();
      await workbook.xlsx.load(buffer as unknown as ExcelJsBuffer);
      const worksheet = workbook.getWorksheet('Sheet1');

      expect(worksheet?.getRow(1).values).toEqual([undefined, 'name', 'age']);
      expect(worksheet?.getRow(2).values).toEqual([undefined, 'John', 30]);
      expect(worksheet?.getRow(3).values).toEqual([undefined, 'Jane', 25]);
    });

    it('should handle nested objects when expandNestedObjects is true', async () => {
      const data = [
        {
          name: 'John',
          address: { city: 'New York', country: 'USA' },
        },
      ];

      const buffer = await adapter.convertToExcel(data, { expandNestedObjects: true });

      const workbook = new Workbook();
      await workbook.xlsx.load(buffer as unknown as ExcelJsBuffer);
      const worksheet = workbook.getWorksheet('Sheet1');

      const headers = worksheet?.getRow(1).values as string[];
      expect(headers).toEqual([undefined, 'name', 'address.city', 'address.country']);

      const dataRow = worksheet?.getRow(2).values;
      expect(dataRow).toEqual([undefined, 'John', 'New York', 'USA']);
    });

    it('should handle arrays when unwindArrays is true', async () => {
      const data = [
        {
          name: 'John',
          hobbies: ['reading', 'gaming'],
        },
      ];

      const buffer = await adapter.convertToExcel(data, { unwindArrays: true });

      const workbook = new Workbook();
      await workbook.xlsx.load(buffer as unknown as ExcelJsBuffer);
      const worksheet = workbook.getWorksheet('Sheet1');

      const headers = worksheet?.getRow(1).values as string[];
      expect(headers).toEqual([undefined, 'name', 'hobbies']);

      // Should create two rows, one for each hobby
      expect(worksheet?.getRow(2).values).toEqual([undefined, 'John', 'reading']);
      expect(worksheet?.getRow(3).values).toEqual([undefined, 'John', 'gaming']);
    });

    it('should handle complex nested arrays and objects', async () => {
      const data = [
        {
          name: 'John',
          contacts: [
            { type: 'email', value: 'john@example.com' },
            { type: 'phone', value: '123-456-7890' },
          ],
        },
      ];

      const buffer = await adapter.convertToExcel(data, {
        expandNestedObjects: true,
        unwindArrays: true,
      });

      const workbook = new Workbook();
      await workbook.xlsx.load(buffer as unknown as ExcelJsBuffer);
      const worksheet = workbook.getWorksheet('Sheet1');

      const headers = worksheet?.getRow(1).values as string[];
      expect(headers).toEqual([undefined, 'name', 'contacts.type', 'contacts.value']);

      expect(worksheet?.getRow(2).values).toEqual([undefined, 'John', 'email', 'john@example.com']);

      expect(worksheet?.getRow(3).values).toEqual([undefined, 'John', 'phone', '123-456-7890']);
    });
  });

  describe('convertStreamToExcel', () => {
    it('should handle empty stream', (done) => {
      const jsonStream = new Readable({
        objectMode: true,
        read() {
          this.push(null);
        },
      });

      const excelStream = adapter.convertStreamToExcel(jsonStream);
      const chunks: Buffer[] = [];

      excelStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      excelStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const workbook = new Workbook();
        workbook.xlsx
          .load(buffer as unknown as ExcelJsBuffer)
          .then(() => {
            const worksheet = workbook.getWorksheet('Sheet1');
            expect(worksheet).toBeDefined();
            expect(worksheet?.rowCount).toBe(0);
            done();
          })
          .catch((error) => {
            done(error);
          });
      });
    });

    it('should convert streaming data with nested objects and arrays', (done) => {
      const testData = [
        {
          name: 'John',
          contacts: [
            { type: 'email', value: 'john@example.com' },
            { type: 'phone', value: '123-456-7890' },
          ],
        },
        {
          name: 'Jane',
          contacts: [{ type: 'email', value: 'jane@example.com' }],
        },
      ];

      const jsonStream = new Readable({
        objectMode: true,
        read() {
          const data = testData.shift();
          this.push(data || null);
        },
      });

      const excelStream = adapter.convertStreamToExcel(jsonStream, {
        expandNestedObjects: true,
        unwindArrays: true,
      });

      const chunks: Buffer[] = [];

      excelStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      excelStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const workbook = new Workbook();
        workbook.xlsx
          .load(buffer as unknown as ExcelJsBuffer)
          .then(() => {
            const worksheet = workbook.getWorksheet('Sheet1');

            const headers = worksheet?.getRow(1).values as string[];
            expect(headers).toEqual([undefined, 'name', 'contacts.type', 'contacts.value']);

            // Check first data row
            expect(worksheet?.getRow(2).values).toEqual([undefined, 'John', 'email', 'john@example.com']);

            // Check second data row
            expect(worksheet?.getRow(3).values).toEqual([undefined, 'John', 'phone', '123-456-7890']);

            // Check third data row
            expect(worksheet?.getRow(4).values).toEqual([undefined, 'Jane', 'email', 'jane@example.com']);

            done();
          })
          .catch((error) => {
            done(error);
          });
      });
    });

    it('should handle stream errors', (done) => {
      const jsonStream = new Readable({
        objectMode: true,
        read() {
          this.emit('error', new Error('Test error'));
        },
      });

      const excelStream = adapter.convertStreamToExcel(jsonStream);

      excelStream.on('error', (error) => {
        expect(error.message).toBe('Test error');
        done();
      });
    });
  });
});
