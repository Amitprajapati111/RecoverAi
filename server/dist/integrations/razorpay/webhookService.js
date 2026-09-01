"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRazorpayWebhookSignature = validateRazorpayWebhookSignature;
exports.checkWebhookIdempotency = checkWebhookIdempotency;
exports.storeWebhookEvent = storeWebhookEvent;
exports.markWebhookProcessed = markWebhookProcessed;
const crypto_1 = __importDefault(require("crypto"));
const WebhookEvent_1 = require("../../models/WebhookEvent");
const logger_1 = require("../../utils/logger");
function validateRazorpayWebhookSignature(rawBody, signature, secret) {
    try {
        const expectedSignature = crypto_1.default
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');
        return crypto_1.default.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(signature, 'hex'));
    }
    catch {
        return false;
    }
}
async function checkWebhookIdempotency(eventId) {
    const existing = await WebhookEvent_1.WebhookEvent.findOne({ eventId });
    return Boolean(existing?.processed);
}
async function storeWebhookEvent(params) {
    try {
        const event = await WebhookEvent_1.WebhookEvent.create({
            merchantId: params.merchantId,
            eventId: params.eventId,
            eventType: params.eventType,
            payload: params.payload,
            signature: params.signature,
            processed: false,
            processingAttempts: 0,
            receivedAt: new Date(),
        });
        return event._id.toString();
    }
    catch (error) {
        // Duplicate key = already received this event
        if (error.code === 11000) {
            logger_1.logger.info(`Webhook already received: ${params.eventId}`);
            return null; // Already processed
        }
        throw error;
    }
}
async function markWebhookProcessed(eventId, error) {
    await WebhookEvent_1.WebhookEvent.updateOne({ eventId }, {
        processed: !error,
        processedAt: new Date(),
        error,
        $inc: { processingAttempts: 1 },
    });
}
//# sourceMappingURL=webhookService.js.map