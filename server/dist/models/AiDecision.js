"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiDecision = void 0;
const mongoose_1 = require("mongoose");
const aiDecisionSchema = new mongoose_1.Schema({
    merchantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    recoveryCaseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'RecoveryCase', required: true },
    model: { type: String, required: true },
    promptVersion: { type: String, required: true },
    inputContext: { type: mongoose_1.Schema.Types.Mixed },
    decision: {
        recoverable: Boolean,
        recoveryProbability: Number,
        riskLevel: String,
        priority: String,
        recommendedAction: String,
        delayMinutes: Number,
        maxAttempts: Number,
        reason: String,
        requiresHumanApproval: Boolean,
        stopConditions: [String],
    },
    confidence: Number,
    reasoning: String,
    policyResult: {
        approved: Boolean,
        blockedReason: String,
        requiresApproval: Boolean,
    },
    executionResult: {
        success: Boolean,
        actionTaken: String,
        error: String,
    },
    latencyMs: Number,
    tokenUsage: {
        promptTokens: Number,
        completionTokens: Number,
        totalTokens: Number,
    },
}, { timestamps: { createdAt: true, updatedAt: false } });
aiDecisionSchema.index({ merchantId: 1 });
aiDecisionSchema.index({ recoveryCaseId: 1 });
aiDecisionSchema.index({ merchantId: 1, createdAt: -1 });
exports.AiDecision = (0, mongoose_1.model)('AiDecision', aiDecisionSchema);
//# sourceMappingURL=AiDecision.js.map