import crypto from 'crypto';
import http from 'http';
import mongoose from 'mongoose';
import { createApp } from '../../app';
import { env } from '../../config/env';

describe('Webhook Security Test Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || 'recoverai_test_secret';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  });

  // Case 1: Valid Signature -> 200 OK
  it('Case 1: should accept webhook with VALID signature and return 200 OK', async () => {
    const payload = {
      id: `evt_valid_sig_${Date.now()}`,
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: `pay_test_${Date.now()}`,
            amount: 250000,
            currency: 'INR',
            status: 'failed',
          },
        },
      },
    };

    const rawBody = JSON.stringify(payload);
    const validSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const res = await fetch(`${baseUrl}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validSignature,
      },
      body: rawBody,
    });

    const data = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(data.received).toBe(true);
  });

  // Case 2: Invalid Signature -> 401 Unauthorized
  it('Case 2: should reject webhook with INVALID signature and return 401 Unauthorized', async () => {
    const payload = {
      id: `evt_invalid_sig_${Date.now()}`,
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: `pay_test_${Date.now()}`,
            amount: 500000,
          },
        },
      },
    };

    const rawBody = JSON.stringify(payload);
    const forgedSignature = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

    const res = await fetch(`${baseUrl}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': forgedSignature,
      },
      body: rawBody,
    });

    const data = (await res.json()) as any;
    expect(res.status).toBe(401);
    expect(data.error.code).toBe('INVALID_SIGNATURE');
  });

  // Case 3: Malformed Payload -> 400 Bad Request
  it('Case 3: should reject MALFORMED payload (missing event type) and return 400 Bad Request', async () => {
    const malformedPayload = {
      id: 'evt_no_event_type',
      invalidKey: 12345,
    };

    const res = await fetch(`${baseUrl}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(malformedPayload),
    });

    const data = (await res.json()) as any;
    expect(res.status).toBe(400);
    expect(data.error.code).toBe('MALFORMED_PAYLOAD');
  });
});
