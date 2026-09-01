"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const encryption_1 = require("../../utils/encryption");
describe('Encryption & Security Utilities', () => {
    test('Encrypts and decrypts sensitive secrets symmetrically', () => {
        const original = 'rzp_test_secret_1234567890abcdef';
        const encrypted = (0, encryption_1.encrypt)(original);
        expect(encrypted).not.toBe(original);
        expect(encrypted).toContain(':');
        const decrypted = (0, encryption_1.decrypt)(encrypted);
        expect(decrypted).toBe(original);
    });
    test('Generates deterministic idempotency keys', () => {
        const key1 = (0, encryption_1.generateIdempotencyKey)('case_123', 'CREATE_PAYMENT_LINK', '1');
        const key2 = (0, encryption_1.generateIdempotencyKey)('case_123', 'CREATE_PAYMENT_LINK', '1');
        const key3 = (0, encryption_1.generateIdempotencyKey)('case_123', 'CREATE_PAYMENT_LINK', '2');
        expect(key1).toBe(key2);
        expect(key1).not.toBe(key3);
        expect(key1.length).toBe(64); // SHA-256 hex
    });
});
//# sourceMappingURL=encryption.test.js.map