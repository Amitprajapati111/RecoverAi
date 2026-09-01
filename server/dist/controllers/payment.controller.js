"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentById = exports.getFailedPayments = exports.getPayments = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const Payment_1 = require("../models/Payment");
const RecoveryCase_1 = require("../models/RecoveryCase");
const auditService_1 = require("../audit/auditService");
const constants_1 = require("../config/constants");
exports.getPayments = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const page = parseInt(req.query.page) || constants_1.PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || constants_1.PAGINATION.DEFAULT_LIMIT, constants_1.PAGINATION.MAX_LIMIT);
    const { status, method, failureType, search } = req.query;
    const query = { merchantId };
    if (status)
        query.status = status;
    if (method)
        query.method = method;
    if (failureType)
        query.failureType = failureType;
    if (search) {
        query.$or = [
            { razorpayPaymentId: { $regex: search, $options: 'i' } },
            { razorpayOrderId: { $regex: search, $options: 'i' } },
            { failureReason: { $regex: search, $options: 'i' } },
        ];
    }
    const [payments, total] = await Promise.all([
        Payment_1.Payment.find(query)
            .populate('customerId', 'name email phone recoveryScore customerSegment')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Payment_1.Payment.countDocuments(query),
    ]);
    (0, apiResponse_1.sendSuccess)(res, payments, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });
});
exports.getFailedPayments = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const page = parseInt(req.query.page) || constants_1.PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || constants_1.PAGINATION.DEFAULT_LIMIT, constants_1.PAGINATION.MAX_LIMIT);
    const query = { merchantId, status: constants_1.PAYMENT_STATUS.FAILED };
    const [payments, total] = await Promise.all([
        Payment_1.Payment.find(query)
            .populate('customerId', 'name email phone recoveryScore customerSegment')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Payment_1.Payment.countDocuments(query),
    ]);
    (0, apiResponse_1.sendSuccess)(res, payments, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });
});
exports.getPaymentById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const merchantId = req.user.merchantId;
    const payment = await Payment_1.Payment.findOne({ _id: id, merchantId })
        .populate('customerId')
        .lean();
    if (!payment)
        throw apiResponse_1.errors.notFound('Payment');
    const recoveryCase = await RecoveryCase_1.RecoveryCase.findOne({ paymentId: id })
        .populate('aiDecisionId')
        .lean();
    const auditLogs = await auditService_1.auditService.getForEntity(merchantId, 'Payment', id);
    (0, apiResponse_1.sendSuccess)(res, { payment, recoveryCase, auditTrail: auditLogs });
});
//# sourceMappingURL=payment.controller.js.map