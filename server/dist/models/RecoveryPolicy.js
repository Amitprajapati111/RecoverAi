"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryPolicy = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../config/constants");
const recoveryPolicySchema = new mongoose_1.Schema({
    merchantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Merchant', required: true, unique: true },
    maxAttempts: { type: Number, default: constants_1.DEFAULT_POLICY.maxAttempts },
    maxAmountPerAction: { type: Number, default: constants_1.DEFAULT_POLICY.maxAmountPerAction },
    minimumRecoveryProbability: { type: Number, default: constants_1.DEFAULT_POLICY.minimumRecoveryProbability },
    cooldownMinutes: { type: Number, default: constants_1.DEFAULT_POLICY.cooldownMinutes },
    allowedActions: {
        type: [{ type: String, enum: Object.values(constants_1.RECOVERY_ACTION) }],
        default: constants_1.DEFAULT_POLICY.allowedActions,
    },
    allowedChannels: { type: [String], default: ['email', 'sms', 'whatsapp'] },
    requireApprovalAboveAmount: {
        type: Number,
        default: constants_1.DEFAULT_POLICY.requireApprovalAboveAmount,
    },
    stopAfterSuccessfulPayment: { type: Boolean, default: true },
    stopAfterMaxAttempts: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
recoveryPolicySchema.index({ merchantId: 1 }, { unique: true });
exports.RecoveryPolicy = (0, mongoose_1.model)('RecoveryPolicy', recoveryPolicySchema);
//# sourceMappingURL=RecoveryPolicy.js.map