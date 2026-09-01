"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("../../app");
const env_1 = require("../../config/env");
describe('Webhook Security Test Suite', () => {
    let server;
    let baseUrl;
    const webhookSecret = env_1.env.RAZORPAY_WEBHOOK_SECRET || 'recoverai_test_secret';
    beforeAll(async () => {
        if (mongoose_1.default.connection.readyState === 0) {
            await mongoose_1.default.connect(env_1.env.MONGODB_URI);
        }
        const app = (0, app_1.createApp)();
        await new Promise((resolve) => {
            server = app.listen(0, () => {
                const addr = server.address();
                baseUrl = `http://127.0.0.1:${addr.port}`;
                resolve();
            });
        });
    });
    afterAll(async () => {
        await new Promise((resolve) => server.close(() => resolve()));
        await mongoose_1.default.disconnect();
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
        const validSignature = crypto_1.default
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
        const data = (await res.json());
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
        const data = (await res.json());
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
        const data = (await res.json());
        expect(res.status).toBe(400);
        expect(data.error.code).toBe('MALFORMED_PAYLOAD');
    });
});
//# sourceMappingURL=webhookSecurity.test.js.map