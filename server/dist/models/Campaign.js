"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Campaign = void 0;
const mongoose_1 = require("mongoose");
const campaignSchema = new mongoose_1.Schema({
    merchantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    name: { type: String, required: true, trim: true },
    description: String,
    triggerCondition: {
        minAmount: { type: Number, default: 0 },
        maxAmount: Number,
        failureTypes: [String],
        customerSegments: [String],
        minRecoveryProbability: { type: Number, default: 0.6 },
    },
    actions: [
        {
            actionType: { type: String, required: true },
            delayMinutes: { type: Number, default: 15 },
            channel: { type: String, default: 'email' },
            templateId: String,
        },
    ],
    maxAttempts: { type: Number, default: 2 },
    stopConditions: { type: [String], default: ['payment_success', 'max_attempts_reached'] },
    isActive: { type: Boolean, default: true },
    metrics: {
        totalTriggered: { type: Number, default: 0 },
        totalRecovered: { type: Number, default: 0 },
        recoveredRevenue: { type: Number, default: 0 },
        recoveryRate: { type: Number, default: 0 },
    },
}, { timestamps: true });
campaignSchema.index({ merchantId: 1 });
campaignSchema.index({ merchantId: 1, isActive: 1 });
exports.Campaign = (0, mongoose_1.model)('Campaign', campaignSchema);
//# sourceMappingURL=Campaign.js.map