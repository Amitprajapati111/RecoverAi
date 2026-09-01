"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const auditService_1 = require("../audit/auditService");
const constants_1 = require("../config/constants");
exports.getAuditLogs = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const page = parseInt(req.query.page) || constants_1.PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || constants_1.PAGINATION.DEFAULT_LIMIT, constants_1.PAGINATION.MAX_LIMIT);
    const { actorType, action } = req.query;
    const result = await auditService_1.auditService.getForMerchant(merchantId, page, limit, { actorType, action });
    (0, apiResponse_1.sendSuccess)(res, result.logs, 200, {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
    });
});
//# sourceMappingURL=audit.controller.js.map