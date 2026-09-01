"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingApprovals = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const RecoveryCase_1 = require("../models/RecoveryCase");
const constants_1 = require("../config/constants");
exports.getPendingApprovals = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const page = parseInt(req.query.page) || constants_1.PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || constants_1.PAGINATION.DEFAULT_LIMIT, constants_1.PAGINATION.MAX_LIMIT);
    const query = {
        merchantId,
        $or: [{ requiresHumanApproval: true }, { status: constants_1.RECOVERY_CASE_STATUS.ESCALATED }],
    };
    const [cases, total] = await Promise.all([
        RecoveryCase_1.RecoveryCase.find(query)
            .populate('paymentId')
            .populate('customerId')
            .populate('aiDecisionId')
            .sort({ amountAtRisk: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        RecoveryCase_1.RecoveryCase.countDocuments(query),
    ]);
    (0, apiResponse_1.sendSuccess)(res, cases, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });
});
//# sourceMappingURL=approval.controller.js.map