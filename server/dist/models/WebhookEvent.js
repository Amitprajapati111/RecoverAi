"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookEvent = void 0;
const mongoose_1 = require("mongoose");
const webhookEventSchema = new mongoose_1.Schema({
    merchantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Merchant' },
    eventId: { type: String, required: true },
    eventType: { type: String, required: true },
    payload: { type: mongoose_1.Schema.Types.Mixed, required: true },
    signature: String,
    processed: { type: Boolean, default: false },
    processingAttempts: { type: Number, default: 0 },
    receivedAt: { type: Date, default: Date.now },
    processedAt: Date,
    error: String,
    jobId: String,
}, {});
// Critical: unique index on eventId for idempotency
webhookEventSchema.index({ eventId: 1 }, { unique: true });
webhookEventSchema.index({ eventType: 1 });
webhookEventSchema.index({ processed: 1 });
webhookEventSchema.index({ receivedAt: -1 });
exports.WebhookEvent = (0, mongoose_1.model)('WebhookEvent', webhookEventSchema);
//# sourceMappingURL=WebhookEvent.js.map