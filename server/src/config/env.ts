import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  LOAD_TEST_MODE: z.coerce.boolean().default(false),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/recoverai'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('recoverai-jwt-secret-change-in-production'),
  JWT_REFRESH_SECRET: z.string().default('recoverai-refresh-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(''),
  RAZORPAY_ENV: z.enum(['test', 'live']).default('test'),
  DEMO_MODE: z.coerce.boolean().default(false),
  AI_PROVIDER: z.enum(['mock', 'openai', 'anthropic']).default('mock'),
  AI_API_KEY: z.string().default(''),
  AI_MODEL: z.string().default('gpt-4o-mini'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  ENCRYPTION_KEY: z.string().default('recoverai-encryption-key-32-chars!!'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
