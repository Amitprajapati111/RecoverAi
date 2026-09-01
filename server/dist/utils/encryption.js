"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.generateIdempotencyKey = generateIdempotencyKey;
exports.generateSecureToken = generateSecureToken;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(env_1.env.ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0'), 'utf8');
function encrypt(text) {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}
function decrypt(encryptedText) {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
function generateIdempotencyKey(...parts) {
    return crypto_1.default
        .createHash('sha256')
        .update(parts.join(':'))
        .digest('hex');
}
function generateSecureToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
//# sourceMappingURL=encryption.js.map