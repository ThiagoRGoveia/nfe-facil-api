import { SecretAdapter } from './secret.adapter';

describe('SecretAdapter', () => {
  let adapter: SecretAdapter;

  beforeEach(() => {
    adapter = new SecretAdapter();
  });

  it('should generate a 36 character base64 string', () => {
    const secret = adapter.generate();
    expect(secret).toHaveLength(36);
    expect(secret).toMatch(/^[A-Z0-9+/]+$/);
  });

  it('should generate unique secrets', () => {
    const secret1 = adapter.generate();
    const secret2 = adapter.generate();
    expect(secret1).not.toBe(secret2);
  });

  it('should only contain uppercase characters', () => {
    const secret = adapter.generate();
    expect(secret).toBe(secret.toUpperCase());
  });
});
