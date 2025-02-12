import { Json2CsvAdapter } from './json-2-csv.adapter';

describe('Json2CsvAdapter', () => {
  let adapter: Json2CsvAdapter;

  beforeEach(() => {
    adapter = new Json2CsvAdapter();
  });

  describe('convertToCsv', () => {
    it('should create an empty CSV when no data is provided', () => {
      const csv = adapter.convertToCsv([]);
      expect(csv.trim()).toBe(''); // Just BOM mark for Excel
    });

    it('should convert simple data to CSV format', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const csv = adapter.convertToCsv(data);
      const lines = csv.split('\n');
      const cleanFirstLine = lines[0].replace('\ufeff', '');

      expect(cleanFirstLine).toBe('name,age');
      expect(lines[1]).toBe('John,30');
      expect(lines[2]).toBe('Jane,25');
    });

    it('should handle nested objects when expandNestedObjects is true', () => {
      const data = [
        {
          name: 'John',
          address: { city: 'New York', country: 'USA' },
        },
      ];

      const csv = adapter.convertToCsv(data, { expandNestedObjects: true });
      const lines = csv.split('\n');
      const cleanFirstLine = lines[0].replace('\ufeff', '');

      expect(cleanFirstLine).toBe('name,address.city,address.country');
      expect(lines[1]).toBe('John,New York,USA');
    });

    it('should keep nested objects as JSON when expandNestedObjects is false', () => {
      const data = [
        {
          name: 'John',
          address: { city: 'New York', country: 'USA' },
        },
      ];

      const csv = adapter.convertToCsv(data, { expandNestedObjects: false });
      const lines = csv.split('\n');
      const cleanFirstLine = lines[0].replace('\ufeff', '');

      expect(cleanFirstLine).toBe('name,address');
      expect(lines[1]).toBe('John,"{""city"":""New York"",""country"":""USA""}"');
    });

    it('should handle arrays when unwindArrays is true', () => {
      const data = [
        {
          name: 'John',
          hobbies: ['reading', 'gaming'],
        },
      ];

      const csv = adapter.convertToCsv(data, { unwindArrays: true });
      const lines = csv.split('\n');
      const cleanFirstLine = lines[0].replace('\ufeff', '');

      expect(cleanFirstLine).toBe('name,hobbies');
      expect(lines[1]).toBe('John,reading');
      expect(lines[2]).toBe('John,gaming');
    });

    it('should keep arrays as JSON when unwindArrays is false', () => {
      const data = [
        {
          name: 'John',
          hobbies: ['reading', 'gaming'],
        },
      ];

      const csv = adapter.convertToCsv(data, { unwindArrays: false });
      const lines = csv.split('\n');
      const cleanFirstLine = lines[0].replace('\ufeff', '');

      expect(cleanFirstLine).toBe('name,hobbies');
      expect(lines[1]).toBe('John,"[""reading"",""gaming""]"');
    });

    it('should handle complex nested arrays and objects with both options', () => {
      const data = [
        {
          name: 'John',
          contacts: [
            { type: 'email', value: 'john@example.com' },
            { type: 'phone', value: '123-456-7890' },
          ],
        },
      ];

      const csv = adapter.convertToCsv(data, {
        expandNestedObjects: true,
        unwindArrays: true,
      });
      const lines = csv.split('\n');
      const cleanFirstLine = lines[0].replace('\ufeff', '');

      expect(cleanFirstLine).toBe('name,contacts.type,contacts.value');
      expect(lines[1]).toBe('John,email,john@example.com');
      expect(lines[2]).toBe('John,phone,123-456-7890');
    });

    it('should handle special characters in CSV', () => {
      const data = [{ name: 'John, Jr.', description: 'Likes "quotes" and, commas' }];

      const csv = adapter.convertToCsv(data);
      const lines = csv.split('\n');
      const cleanFirstLine = lines[0].replace('\ufeff', '');

      expect(cleanFirstLine).toBe('name,description');
      expect(lines[1]).toBe('"John, Jr.","Likes ""quotes"" and, commas"');
    });
  });
});
