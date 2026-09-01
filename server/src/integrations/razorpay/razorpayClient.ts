import Razorpay from 'razorpay';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!razorpayInstance) {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      logger.warn(
        'Razorpay credentials not configured. Running in DEMO MODE without live API calls.'
      );
      // Return a mock-compatible instance — actual calls will be intercepted
    }

    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID || 'rzp_test_demo',
      key_secret: env.RAZORPAY_KEY_SECRET || 'demo_secret',
    });
  }
  return razorpayInstance;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

export function getRazorpayEnvironment(): 'test' | 'live' {
  return env.RAZORPAY_ENV;
}
