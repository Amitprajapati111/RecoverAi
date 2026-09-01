"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryAttempt = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../config/constants");
const recoveryAttemptSchema = new mongoose_1.Schema({
    merchantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    recoveryCaseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'RecoveryCase', required: true },
    action: { type: String, enum: Object.values(constants_1.RECOVERY_ACTION), required: true },
    channel: String,
    status: {
        type: String,
        enum: ['SCHEDULED', 'EXECUTING', 'SUCCESS', 'FAILED', 'CANCELLED'],
        default: 'SCHEDULED',
    },
    attemptNumber: { type: Number, required: true },
    idempotencyKey: { type: String, required: true },
    scheduledAt: Date,
    executedAt: Date,
    result: { type: mongoose_1.Schema.Types.Mixed },
    failureReason: String,
    recoveredAmount: Number,
    paymentLinkId: String,
    paymentLinkUrl: String,
    isSimulated: { type: Boolean, default: false },
}, { timestamps: true });
recoveryAttemptSchema.index({ merchantId: 1 });
recoveryAttemptSchema.index({ recoveryCaseId: 1 });
recoveryAttemptSchema.index({ idempotencyKey: 1 }, { unique: true });
exports.RecoveryAttempt = (0, mongoose_1.model)('RecoveryAttempt', recoveryAttemptSchema);
//# sourceMappingURL=RecoveryAttempt.js.map