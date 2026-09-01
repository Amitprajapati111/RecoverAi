"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopRecovery = exports.rejectAction = exports.approveAction = exports.triggerAnalysis = exports.getCaseById = exports.getCases = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const recovery_service_1 = require("../services/recovery.service");
const RecoveryCase_1 = require("../models/RecoveryCase");
const RecoveryAttempt_1 = require("../models/RecoveryAttempt");
const auditService_1 = require("../audit/auditService");
const constants_1 = require("../config/constants");
exports.getCases = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const page = parseInt(req.query.page) || constants_1.PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || constants_1.PAGINATION.DEFAULT_LIMIT, constants_1.PAGINATION.MAX_LIMIT);
    const { status, priority } = req.query;
    const result = await recovery_service_1.recoveryService.getCases(merchantId, page, limit, { status, priority });
    (0, apiResponse_1.sendSuccess)(res, result.cases, 200, {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
    });
});
exports.getCaseById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const merchantId = req.user.merchantId;
    const recoveryCase = await RecoveryCase_1.RecoveryCase.findOne({ _id: id, merchantId })
        .populate('paymentId')
        .populate('customerId', 'name email phone recoveryScore customerSegment')
        .populate('aiDecisionId')
        .lean();
    if (!recoveryCase)
        throw apiResponse_1.errors.notFound('Recovery Case');
    const attempts = await RecoveryAttempt_1.RecoveryAttempt.find({ recoveryCaseId: id, merchantId })
        .sort({ createdAt: -1 })
        .lean();
    const auditLogs = await auditService_1.auditService.getForEntity(merchantId, 'RecoveryCase', id);
    (0, apiResponse_1.sendSuccess)(res, { recoveryCase, attempts, auditTrail: auditLogs });
});
exports.triggerAnalysis = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const merchantId = req.user.merchantId;
    const recoveryCase = await RecoveryCase_1.RecoveryCase.findOne({ _id: id, merchantId });
    if (!recoveryCase)
        throw apiResponse_1.errors.notFound('Recovery Case');
    await recovery_service_1.recoveryService.analyzeWithAI(id);
    const updated = await RecoveryCase_1.RecoveryCase.findById(id).lean();
    (0, apiResponse_1.sendSuccess)(res, { recoveryCase: updated, message: 'AI analysis triggered successfully' });
});
exports.approveAction = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const merchantId = req.user.merchantId;
    const userId = req.user.userId;
    const recoveryCase = await RecoveryCase_1.RecoveryCase.findOne({ _id: id, merchantId });
    if (!recoveryCase)
        throw apiResponse_1.errors.notFound('Recovery Case');
    if (!recoveryCase.requiresHumanApproval) {
        throw apiResponse_1.errors.badRequest('This case does not require human approval');
    }
    await RecoveryCase_1.RecoveryCase.findByIdAndUpdate(id, {
        requiresHumanApproval: false,
        approvedBy: userId,
        approvedAt: new Date(),
        status: constants_1.RECOVERY_CASE_STATUS.RECOVERABLE,
    });
    // Execute the recommended action
    const result = await recovery_service_1.recoveryService.executeAction(id, recoveryCase.recommendedAction, 0);
    await auditService_1.auditService.log({
        merchantId,
        actorType: constants_1.ACTOR_TYPE.USER,
        actorId: userId,
        action: 'HUMAN_APPROVED_RECOVERY',
        entityType: 'RecoveryCase',
        entityId: id,
        after: result,
    });
    (0, apiResponse_1.sendSuccess)(res, { result, message: 'Recovery action approved and executed' });
});
exports.rejectAction = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const merchantId = req.user.merchantId;
    const userId = req.user.userId;
    const { reason } = req.body;
    const recoveryCase = await RecoveryCase_1.RecoveryCase.findOne({ _id: id, merchantId });
    if (!recoveryCase)
        throw apiResponse_1.errors.notFound('Recovery Case');
    await RecoveryCase_1.RecoveryCase.findByIdAndUpdate(id, {
        status: constants_1.RECOVERY_CASE_STATUS.STOPPED,
        requiresHumanApproval: false,
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: reason || 'Rejected by merchant',
    });
    await auditService_1.auditService.log({
        merchantId,
        actorType: constants_1.ACTOR_TYPE.USER,
        actorId: userId,
        action: 'HUMAN_REJECTED_RECOVERY',
        entityType: 'RecoveryCase',
        entityId: id,
        reason,
    });
    (0, apiResponse_1.sendSuccess)(res, { message: 'Recovery action rejected' });
});
exports.stopRecovery = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const merchantId = req.user.merchantId;
    const recoveryCase = await RecoveryCase_1.RecoveryCase.findOne({ _id: id, merchantId });
    if (!recoveryCase)
        throw apiResponse_1.errors.notFound('Recovery Case');
    await RecoveryCase_1.RecoveryCase.findByIdAndUpdate(id, {
        status: constants_1.RECOVERY_CASE_STATUS.STOPPED,
        currentStage: 'MANUALLY_STOPPED',
    });
    (0, apiResponse_1.sendSuccess)(res, { message: 'Recovery stopped' });
});
//# sourceMappingURL=recovery.controller.js.map