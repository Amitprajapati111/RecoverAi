"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../config/constants");
const paymentSchema = new mongoose_1.Schema({
    merchantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer' },
    razorpayPaymentId: { type: String, sparse: true },
    razorpayOrderId: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
        type: String,
        enum: Object.values(constants_1.PAYMENT_STATUS),
        default: constants_1.PAYMENT_STATUS.CREATED,
    },
    method: String,
    failureReason: String,
    failureCode: String,
    failureType: {
        type: String,
        enum: Object.values(constants_1.FAILURE_TYPE),
    },
    capturedAt: Date,
    failedAt: Date,
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    isSimulated: { type: Boolean, default: false },
}, { timestamps: true });
paymentSchema.index({ merchantId: 1 });
paymentSchema.index({ merchantId: 1, status: 1 });
paymentSchema.index({ merchantId: 1, customerId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ merchantId: 1, createdAt: -1 });
paymentSchema.index({ merchantId: 1, createdAt: -1, status: 1 });
paymentSchema.index({ merchantId: 1, status: 1, failureType: 1, createdAt: -1 });
exports.Payment = (0, mongoose_1.model)('Payment', paymentSchema);
//# sourceMappingURL=Payment.js.map