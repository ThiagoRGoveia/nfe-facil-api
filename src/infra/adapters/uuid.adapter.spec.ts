import { UuidAdapter } from './uuid.adapter';
import { validate as uuidValidate } from 'uuid';

describe('UuidAdapter', () => {
  let adapter: UuidAdapter;

  beforeEach(() => {
    adapter = new UuidAdapter();
  });

  it('should generate a valid UUID', () => {
    const uuid = adapter.generate();
    expect(uuidValidate(uuid)).toBe(true);
  });

  it('should generate unique UUIDs', () => {
    const uuid1 = adapter.generate();
    const uuid2 = adapter.generate();
    expect(uuid1).not.toBe(uuid2);
  });
});
