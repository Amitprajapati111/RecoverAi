"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Customer = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../config/constants");
const customerSchema = new mongoose_1.Schema({
    merchantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    externalCustomerId: String,
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: String,
    totalPayments: { type: Number, default: 0 },
    successfulPayments: { type: Number, default: 0 },
    failedPayments: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    lastPaymentAt: Date,
    recoveryScore: { type: Number, default: 50, min: 0, max: 100 },
    customerSegment: {
        type: String,
        enum: Object.values(constants_1.CUSTOMER_SEGMENT),
        default: constants_1.CUSTOMER_SEGMENT.NEW,
    },
    optedOutOfRecovery: { type: Boolean, default: false },
}, { timestamps: true });
customerSchema.index({ merchantId: 1 });
customerSchema.index({ merchantId: 1, email: 1 });
customerSchema.index({ merchantId: 1, externalCustomerId: 1 });
customerSchema.index({ merchantId: 1, customerSegment: 1 });
exports.Customer = (0, mongoose_1.model)('Customer', customerSchema);
//# sourceMappingURL=Customer.js.map