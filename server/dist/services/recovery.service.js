"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recoveryService = void 0;
const Payment_1 = require("../models/Payment");
const RecoveryCase_1 = require("../models/RecoveryCase");
const RecoveryAttempt_1 = require("../models/RecoveryAttempt");
const RecoveryAgent_1 = require("../ai/agents/RecoveryAgent");
const paymentLinkService_1 = require("../integrations/razorpay/paymentLinkService");
const auditService_1 = require("../audit/auditService");
const encryption_1 = require("../utils/encryption");
const constants_1 = require("../config/constants");
const logger_1 = require("../utils/logger");
const apiResponse_1 = require("../utils/apiResponse");
const queues_1 = require("../queues/queues");
const redis_1 = require("../config/redis");
async function invalidateDashboardCache(merchantId) {
    try {
        await redis_1.cache.delPattern(`recoverai:dashboard:${merchantId}:*`);
    }
    catch {
        // Cache invalidation must not interrupt recovery flow
    }
}
/**
 * RecoveryService — orchestrates the full recovery lifecycle:
 * Detect → Diagnose → Predict → Decide → Act → Verify → Recover → Learn
 */
exports.recoveryService = {
    /**
     * Called when a payment fails — creates a recovery case and enqueues AI analysis.
     */
    async createRecoveryCase(paymentId, merchantId) {
        const payment = await Payment_1.Payment.findById(paymentId);
        if (!payment)
            throw apiResponse_1.errors.notFound('Payment');
        if (payment.status !== constants_1.PAYMENT_STATUS.FAILED) {
            throw apiResponse_1.errors.badRequest('Payment is not in failed status');
        }
        // Check if a recovery case already exists for this payment
        const existing = await RecoveryCase_1.RecoveryCase.findOne({ paymentId });
        if (existing) {
            return existing._id.toString();
        }
        // Deterministic pre-checks before AI (cheaper, faster)
        const isHardFailure = [
            constants_1.FAILURE_TYPE.UNKNOWN, // Can still recover
        ].includes(payment.failureType);
        const recoveryCase = await RecoveryCase_1.RecoveryCase.create({
            merchantId,
            paymentId,
            customerId: payment.customerId,
            amountAtRisk: payment.amount,
            status: constants_1.RECOVERY_CASE_STATUS.NEW,
            currentStage: 'CREATED',
            isSimulated: payment.isSimulated,
        });
        const caseId = recoveryCase._id.toString();
        await auditService_1.auditService.log({
            merchantId,
            actorType: constants_1.ACTOR_TYPE.SYSTEM,
            action: 'RECOVERY_CASE_CREATED',
            entityType: 'RecoveryCase',
            entityId: caseId,
            after: { paymentId, amountAtRisk: payment.amount },
        });
        await invalidateDashboardCache(merchantId);
        // Enqueue AI analysis (async)
        await (0, queues_1.enqueueAIAnalysis)({ recoveryCaseId: caseId, merchantId });
        return caseId;
    },
    /**
     * Trigger AI analysis for a recovery case (can be called directly for manual triggers)
     */
    async analyzeWithAI(recoveryCaseId) {
        const { decision, policyResult } = await RecoveryAgent_1.recoveryAgent.analyze(recoveryCaseId);
        // If approved and not waiting for human, execute the action
        if (policyResult.approved && !policyResult.requiresHumanApproval) {
            const recoveryCase = await RecoveryCase_1.RecoveryCase.findById(recoveryCaseId);
            if (recoveryCase) {
                await this.executeAction(recoveryCaseId, decision.recommendedAction, decision.delayMinutes);
            }
        }
    },
    /**
     * Execute a recovery action after policy approval
     */
    async executeAction(recoveryCaseId, action, delayMinutes = 0, clientProvidedKey) {
        const recoveryCase = await RecoveryCase_1.RecoveryCase.findById(recoveryCaseId)
            .populate('customerId');
        if (!recoveryCase)
            throw apiResponse_1.errors.notFound('Recovery Case');
        const payment = await Payment_1.Payment.findById(recoveryCase.paymentId);
        if (!payment)
            throw apiResponse_1.errors.notFound('Payment');
        // Idempotency check: prevent duplicate execution if case is already active with this action
        if (recoveryCase.status === constants_1.RECOVERY_CASE_STATUS.IN_RECOVERY &&
            recoveryCase.selectedAction === action &&
            recoveryCase.currentStage === `${action}_EXECUTED`) {
            logger_1.logger.info('Recovery action already active on case (idempotency)', { recoveryCaseId, action });
            const lastAttempt = await RecoveryAttempt_1.RecoveryAttempt.findOne({ recoveryCaseId, action }).sort({ createdAt: -1 });
            return {
                success: true,
                result: {
                    duplicate: true,
                    paymentLinkId: lastAttempt?.paymentLinkId,
                    paymentLinkUrl: lastAttempt?.paymentLinkUrl,
                },
            };
        }
        // Idempotency key check
        const idempotencyKey = clientProvidedKey ||
            (0, encryption_1.generateIdempotencyKey)(recoveryCaseId, action, recoveryCase.attemptCount.toString());
        const existingAttempt = await RecoveryAttempt_1.RecoveryAttempt.findOne({ idempotencyKey });
        if (existingAttempt) {
            logger_1.logger.info('Recovery action already executed (idempotency)', { idempotencyKey });
            return {
                success: true,
                result: {
                    duplicate: true,
                    paymentLinkId: existingAttempt.paymentLinkId,
                    paymentLinkUrl: existingAttempt.paymentLinkUrl,
                },
            };
        }
        // Create attempt record
        const attempt = await RecoveryAttempt_1.RecoveryAttempt.create({
            merchantId: recoveryCase.merchantId,
            recoveryCaseId,
            action,
            status: 'EXECUTING',
            attemptNumber: recoveryCase.attemptCount + 1,
            idempotencyKey,
            executedAt: new Date(),
            isSimulated: recoveryCase.isSimulated,
        });
        let result = {};
        let success = false;
        try {
            switch (action) {
                case constants_1.RECOVERY_ACTION.CREATE_PAYMENT_LINK: {
                    const customer = recoveryCase.customerId;
                    const link = await paymentLinkService_1.paymentLinkService.create({
                        amount: payment.amount,
                        currency: payment.currency,
                        description: `Payment Recovery - ${payment.razorpayOrderId || 'RecoverAI'}`,
                        customerName: customer?.name,
                        customerEmail: customer?.email,
                        customerPhone: customer?.phone,
                        referenceId: `recovery-${recoveryCaseId}`,
                        expiryMinutes: 24 * 60, // 24 hours
                        notes: { recoveryCaseId, source: 'RecoverAI' },
                    });
                    await RecoveryAttempt_1.RecoveryAttempt.findByIdAndUpdate(attempt._id, {
                        status: 'SUCCESS',
                        paymentLinkId: link.id,
                        paymentLinkUrl: link.short_url,
                        result: link,
                    });
                    result = { paymentLinkId: link.id, paymentLinkUrl: link.short_url, isSimulated: link.isSimulated };
                    success = true;
                    break;
                }
                case constants_1.RECOVERY_ACTION.SEND_REMINDER: {
                    // TODO: Integrate real notification service
                    logger_1.logger.info('SEND_REMINDER: Mock notification sent', { recoveryCaseId });
                    await RecoveryAttempt_1.RecoveryAttempt.findByIdAndUpdate(attempt._id, {
                        status: 'SUCCESS',
                        result: { channel: 'email', notified: true, isSimulated: true },
                    });
                    result = { notified: true, isSimulated: true };
                    success = true;
                    break;
                }
                case constants_1.RECOVERY_ACTION.ESCALATE_TO_HUMAN: {
                    await RecoveryCase_1.RecoveryCase.findByIdAndUpdate(recoveryCaseId, {
                        status: constants_1.RECOVERY_CASE_STATUS.ESCALATED,
                        currentStage: 'ESCALATED_TO_HUMAN',
                    });
                    await RecoveryAttempt_1.RecoveryAttempt.findByIdAndUpdate(attempt._id, {
                        status: 'SUCCESS',
                        result: { escalated: true },
                    });
                    result = { escalated: true };
                    success = true;
                    break;
                }
                case constants_1.RECOVERY_ACTION.STOP: {
                    await RecoveryCase_1.RecoveryCase.findByIdAndUpdate(recoveryCaseId, {
                        status: constants_1.RECOVERY_CASE_STATUS.STOPPED,
                        currentStage: 'STOPPED',
                    });
                    await RecoveryAttempt_1.RecoveryAttempt.findByIdAndUpdate(attempt._id, {
                        status: 'CANCELLED',
                        result: { stopped: true },
                    });
                    result = { stopped: true };
                    success = true;
                    break;
                }
                default: {
                    logger_1.logger.warn(`Unknown recovery action: ${action}`);
                    await RecoveryAttempt_1.RecoveryAttempt.findByIdAndUpdate(attempt._id, {
                        status: 'FAILED',
                        failureReason: `Unknown action: ${action}`,
                    });
                    break;
                }
            }
            // Update recovery case attempt count and status
            if (success && action !== constants_1.RECOVERY_ACTION.STOP) {
                await RecoveryCase_1.RecoveryCase.findByIdAndUpdate(recoveryCaseId, {
                    $inc: { attemptCount: 1 },
                    status: constants_1.RECOVERY_CASE_STATUS.IN_RECOVERY,
                    currentStage: `${action}_EXECUTED`,
                    selectedAction: action,
                });
            }
            await auditService_1.auditService.log({
                merchantId: recoveryCase.merchantId.toString(),
                actorType: constants_1.ACTOR_TYPE.SYSTEM,
                action: `RECOVERY_ACTION_${success ? 'EXECUTED' : 'FAILED'}`,
                entityType: 'RecoveryCase',
                entityId: recoveryCaseId,
                after: { action, result, success },
            });
            await invalidateDashboardCache(recoveryCase.merchantId.toString());
        }
        catch (error) {
            logger_1.logger.error('Recovery action execution failed', { action, recoveryCaseId, error });
            await RecoveryAttempt_1.RecoveryAttempt.findByIdAndUpdate(attempt._id, {
                status: 'FAILED',
                failureReason: error.message,
            });
            await auditService_1.auditService.log({
                merchantId: recoveryCase.merchantId.toString(),
                actorType: constants_1.ACTOR_TYPE.SYSTEM,
                action: 'RECOVERY_ACTION_FAILED',
                entityType: 'RecoveryCase',
                entityId: recoveryCaseId,
                after: { action, error: error.message },
            });
        }
        return { success, result };
    },
    /**
     * Mark a payment as recovered (called when payment_link.paid webhook arrives)
     */
    async markRecovered(recoveryCaseId, amount) {
        const recoveryCase = await RecoveryCase_1.RecoveryCase.findByIdAndUpdate(recoveryCaseId, {
            status: constants_1.RECOVERY_CASE_STATUS.RECOVERED,
            currentStage: 'PAYMENT_RECOVERED',
            recoveredAmount: amount,
        });
        if (recoveryCase?.merchantId) {
            await invalidateDashboardCache(recoveryCase.merchantId.toString());
        }
        await auditService_1.auditService.log({
            merchantId: recoveryCase?.merchantId?.toString() || '',
            actorType: constants_1.ACTOR_TYPE.RAZORPAY,
            action: 'PAYMENT_RECOVERED',
            entityType: 'RecoveryCase',
            entityId: recoveryCaseId,
            after: { recoveredAmount: amount },
        });
    },
    /**
     * Get paginated recovery cases for a merchant
     */
    async getCases(merchantId, page = 1, limit = 20, filters) {
        const query = { merchantId };
        if (filters?.status)
            query.status = filters.status;
        if (filters?.priority)
            query.priority = filters.priority;
        const [cases, total] = await Promise.all([
            RecoveryCase_1.RecoveryCase.find(query)
                .populate('paymentId', 'amount method failureType failureReason')
                .populate('customerId', 'name email')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            RecoveryCase_1.RecoveryCase.countDocuments(query),
        ]);
        return { cases, total, page, limit, totalPages: Math.ceil(total / limit) };
    },
};
//# sourceMappingURL=recovery.service.js.map