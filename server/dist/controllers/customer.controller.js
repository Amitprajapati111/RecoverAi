"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerById = exports.getCustomers = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const Customer_1 = require("../models/Customer");
const Payment_1 = require("../models/Payment");
const RecoveryCase_1 = require("../models/RecoveryCase");
const AuditLog_1 = require("../models/AuditLog");
const constants_1 = require("../config/constants");
exports.getCustomers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const page = parseInt(req.query.page) || constants_1.PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || constants_1.PAGINATION.DEFAULT_LIMIT, constants_1.PAGINATION.MAX_LIMIT);
    const { segment, search } = req.query;
    const query = { merchantId };
    if (segment)
        query.customerSegment = segment;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
        ];
    }
    const [customers, total] = await Promise.all([
        Customer_1.Customer.find(query)
            .sort({ totalRevenue: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Customer_1.Customer.countDocuments(query),
    ]);
    (0, apiResponse_1.sendSuccess)(res, customers, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });
});
exports.getCustomerById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const merchantId = req.user.merchantId;
    const customer = await Customer_1.Customer.findOne({ _id: id, merchantId }).lean();
    if (!customer)
        throw apiResponse_1.errors.notFound('Customer');
    const [payments, recoveryCases, auditLogs] = await Promise.all([
        Payment_1.Payment.find({ merchantId, customerId: id }).sort({ createdAt: -1 }).limit(20).lean(),
        RecoveryCase_1.RecoveryCase.find({ merchantId, customerId: id }).sort({ createdAt: -1 }).limit(10).lean(),
        AuditLog_1.AuditLog.find({ merchantId, entityType: 'Customer', entityId: id }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);
    (0, apiResponse_1.sendSuccess)(res, {
        customer,
        payments,
        recoveryCases,
        auditTrail: auditLogs,
    });
});
//# sourceMappingURL=customer.controller.js.map