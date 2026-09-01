import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../config/constants';
import { env } from '../config/env';

export const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.windowMs,
  max: RATE_LIMITS.AUTH.max,
  skip: () => env.NODE_ENV === 'test',
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many auth requests, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: RATE_LIMITS.API.windowMs,
  max: RATE_LIMITS.API.max,
  skip: () => env.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many API requests, please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiLimiter = rateLimit({
  windowMs: RATE_LIMITS.AI.windowMs,
  max: RATE_LIMITS.AI.max,
  skip: () => env.NODE_ENV === 'test',
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'AI rate limit exceeded. Please wait a minute.' } },
  standardHeaders: true,
  legacyHeaders: false,
});
