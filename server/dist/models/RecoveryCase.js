"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryCase = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../config/constants");
const recoveryCaseSchema = new mongoose_1.Schema({
    merchantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    paymentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Payment', required: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer' },
    amountAtRisk: { type: Number, required: true },
    recoveryProbability: { type: Number, default: 0 },
    riskLevel: { type: String, enum: Object.values(constants_1.RISK_LEVEL), default: constants_1.RISK_LEVEL.MEDIUM },
    priority: { type: String, enum: Object.values(constants_1.PRIORITY), default: constants_1.PRIORITY.MEDIUM },
    status: {
        type: String,
        enum: Object.values(constants_1.RECOVERY_CASE_STATUS),
        default: constants_1.RECOVERY_CASE_STATUS.NEW,
    },
    currentStage: { type: String, default: 'CREATED' },
    recommendedAction: { type: String, enum: Object.values(constants_1.RECOVERY_ACTION) },
    selectedAction: { type: String, enum: Object.values(constants_1.RECOVERY_ACTION) },
    reasoning: String,
    aiDecisionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AiDecision' },
    attemptCount: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    nextActionAt: Date,
    recoveredAmount: Number,
    requiresHumanApproval: { type: Boolean, default: false },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionReason: String,
    stopConditions: [String],
    isSimulated: { type: Boolean, default: false },
}, { timestamps: true });
recoveryCaseSchema.index({ merchantId: 1 });
recoveryCaseSchema.index({ merchantId: 1, status: 1 });
recoveryCaseSchema.index({ merchantId: 1, priority: 1, status: 1 });
recoveryCaseSchema.index({ paymentId: 1 }, { unique: true });
recoveryCaseSchema.index({ merchantId: 1, createdAt: -1 });
recoveryCaseSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
recoveryCaseSchema.index({ merchantId: 1, createdAt: -1, amountAtRisk: 1, recoveredAmount: 1 });
exports.RecoveryCase = (0, mongoose_1.model)('RecoveryCase', recoveryCaseSchema);
//# sourceMappingURL=RecoveryCase.js.map