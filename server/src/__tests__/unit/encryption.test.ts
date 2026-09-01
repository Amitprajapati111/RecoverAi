import { encrypt, decrypt, generateIdempotencyKey } from '../../utils/encryption';

describe('Encryption & Security Utilities', () => {
  test('Encrypts and decrypts sensitive secrets symmetrically', () => {
    const original = 'rzp_test_secret_1234567890abcdef';
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted).toContain(':');

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  test('Generates deterministic idempotency keys', () => {
    const key1 = generateIdempotencyKey('case_123', 'CREATE_PAYMENT_LINK', '1');
    const key2 = generateIdempotencyKey('case_123', 'CREATE_PAYMENT_LINK', '1');
    const key3 = generateIdempotencyKey('case_123', 'CREATE_PAYMENT_LINK', '2');

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key1.length).toBe(64); // SHA-256 hex
  });
});
