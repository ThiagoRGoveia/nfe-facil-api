import { ExcelAdapter } from './excel.adapter';
import { Workbook } from 'exceljs';
import * as fs from 'fs';

describe('ExcelAdapter', () => {
  let adapter: ExcelAdapter;

  beforeEach(() => {
    adapter = new ExcelAdapter();
  });

  describe('convertToExcel', () => {
    it('should create an empty Excel file when no data is provided', async () => {
      const buffer = await adapter.convertToExcel([]);

      const workbook = new Workbook();
      await workbook.xlsx.load(buffer);
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
      await workbook.xlsx.load(buffer);
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
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.getWorksheet('Sheet1');

      const headers = worksheet?.getRow(1).values as string[];
      expect(headers).toEqual([undefined, 'name', 'address.city', 'address.country']);

      const dataRow = worksheet?.getRow(2).values;
      expect(dataRow).toEqual([undefined, 'John', 'New York', 'USA']);
      fs.writeFileSync('test.xlsx', buffer);
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
      await workbook.xlsx.load(buffer);
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
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.getWorksheet('Sheet1');

      const headers = worksheet?.getRow(1).values as string[];
      expect(headers).toEqual([undefined, 'name', 'contacts.type', 'contacts.value']);

      expect(worksheet?.getRow(2).values).toEqual([undefined, 'John', 'email', 'john@example.com']);

      expect(worksheet?.getRow(3).values).toEqual([undefined, 'John', 'phone', '123-456-7890']);
      fs.writeFileSync('test.xlsx', buffer);
    });
  });
});
