"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('5000'),
    LOAD_TEST_MODE: zod_1.z.coerce.boolean().default(false),
    MONGODB_URI: zod_1.z.string().default('mongodb://localhost:27017/recoverai'),
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
    JWT_SECRET: zod_1.z.string().default('recoverai-jwt-secret-change-in-production'),
    JWT_REFRESH_SECRET: zod_1.z.string().default('recoverai-refresh-secret-change-in-production'),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    RAZORPAY_KEY_ID: zod_1.z.string().default(''),
    RAZORPAY_KEY_SECRET: zod_1.z.string().default(''),
    RAZORPAY_WEBHOOK_SECRET: zod_1.z.string().default(''),
    RAZORPAY_ENV: zod_1.z.enum(['test', 'live']).default('test'),
    DEMO_MODE: zod_1.z.coerce.boolean().default(false),
    AI_PROVIDER: zod_1.z.enum(['mock', 'openai', 'anthropic']).default('mock'),
    AI_API_KEY: zod_1.z.string().default(''),
    AI_MODEL: zod_1.z.string().default('gpt-4o-mini'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:3000'),
    ENCRYPTION_KEY: zod_1.z.string().default('recoverai-encryption-key-32-chars!!'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map