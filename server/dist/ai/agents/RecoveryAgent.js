"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recoveryAgent = exports.RecoveryAgent = void 0;
const MockAIProvider_1 = require("../providers/MockAIProvider");
const OpenAIProvider_1 = require("../providers/OpenAIProvider");
const AiDecision_1 = require("../../models/AiDecision");
const RecoveryCase_1 = require("../../models/RecoveryCase");
const Payment_1 = require("../../models/Payment");
const Customer_1 = require("../../models/Customer");
const RecoveryPolicy_1 = require("../../models/RecoveryPolicy");
const PolicyEngine_1 = require("../../policies/PolicyEngine");
const auditService_1 = require("../../audit/auditService");
const constants_1 = require("../../config/constants");
const env_1 = require("../../config/env");
const logger_1 = require("../../utils/logger");
/**
 * RecoveryAgent — Main AI orchestrator
 *
 * Workflow:
 * 1. Load context (payment, customer, policy)
 * 2. Call AI provider for decision
 * 3. Run through policy engine (deterministic guardrails)
 * 4. Store decision in DB
 * 5. Update recovery case
 * 6. Return result (execution happens in recovery service)
 */
class RecoveryAgent {
    constructor() {
        this.provider = this.initProvider();
    }
    initProvider() {
        if (env_1.env.AI_PROVIDER === 'openai' && env_1.env.AI_API_KEY) {
            return new OpenAIProvider_1.OpenAIProvider();
        }
        // Default to mock for demo/no-key mode
        return new MockAIProvider_1.MockAIProvider();
    }
    async analyze(recoveryCaseId) {
        const startMs = Date.now();
        // Load recovery case with related data
        const recoveryCase = await RecoveryCase_1.RecoveryCase.findById(recoveryCaseId);
        if (!recoveryCase)
            throw new Error(`Recovery case not found: ${recoveryCaseId}`);
        const [payment, customer, policy] = await Promise.all([
            Payment_1.Payment.findById(recoveryCase.paymentId),
            recoveryCase.customerId ? Customer_1.Customer.findById(recoveryCase.customerId) : null,
            RecoveryPolicy_1.RecoveryPolicy.findOne({ merchantId: recoveryCase.merchantId }),
        ]);
        if (!payment)
            throw new Error(`Payment not found for case: ${recoveryCaseId}`);
        const effectivePolicy = policy || {
            ...constants_1.DEFAULT_POLICY,
            requireApprovalAboveAmount: constants_1.DEFAULT_POLICY.requireApprovalAboveAmount,
            allowedActions: [...constants_1.DEFAULT_POLICY.allowedActions],
        };
        // Build AI context — minimal data, no sensitive fields
        const context = {
            payment: {
                amount: payment.amount,
                currency: payment.currency,
                method: payment.method || 'unknown',
                failureReason: payment.failureReason || 'Unknown failure',
                failureCode: payment.failureCode || '',
                failureType: payment.failureType || 'UNKNOWN',
            },
            customer: {
                segment: customer?.customerSegment || 'NEW',
                recoveryScore: customer?.recoveryScore || 50,
                totalPayments: customer?.totalPayments || 0,
                successfulPayments: customer?.successfulPayments || 0,
                failedPayments: customer?.failedPayments || 0,
                averageOrderValue: customer?.averageOrderValue || payment.amount,
            },
            recoveryCase: {
                attemptCount: recoveryCase.attemptCount,
                maxAttempts: recoveryCase.maxAttempts,
            },
            policy: {
                minimumRecoveryProbability: effectivePolicy.minimumRecoveryProbability,
                requireApprovalAboveAmount: effectivePolicy.requireApprovalAboveAmount,
                allowedActions: effectivePolicy.allowedActions,
                maxAttempts: effectivePolicy.maxAttempts,
            },
        };
        // Update case to ANALYZING status
        await RecoveryCase_1.RecoveryCase.findByIdAndUpdate(recoveryCaseId, {
            status: constants_1.RECOVERY_CASE_STATUS.ANALYZING,
            currentStage: 'AI_ANALYZING',
        });
        // Call AI provider
        let aiDecision;
        try {
            aiDecision = await this.provider.analyzeForRecovery(context);
        }
        catch (error) {
            logger_1.logger.error('RecoveryAgent: AI provider failed, using fallback', error);
            // Fallback: use mock AI
            const fallback = new MockAIProvider_1.MockAIProvider();
            aiDecision = await fallback.analyzeForRecovery(context);
            aiDecision.reason = '[FALLBACK] ' + aiDecision.reason;
        }
        // Run policy engine — this is mandatory and cannot be bypassed
        const policyResult = PolicyEngine_1.policyEngine.evaluate(aiDecision, recoveryCase, customer, effectivePolicy, undefined);
        const latencyMs = Date.now() - startMs;
        // Store AI decision
        const aiDecisionDoc = await AiDecision_1.AiDecision.create({
            merchantId: recoveryCase.merchantId,
            recoveryCaseId: recoveryCase._id,
            model: this.provider.name + '/' + this.provider.version,
            promptVersion: 'recovery-v1.0',
            inputContext: {
                // Store minimal context, not raw customer PII
                paymentAmount: context.payment.amount,
                paymentMethod: context.payment.method,
                failureType: context.payment.failureType,
                customerSegment: context.customer.segment,
                attemptCount: context.recoveryCase.attemptCount,
            },
            decision: aiDecision,
            confidence: aiDecision.confidence,
            reasoning: aiDecision.reason,
            policyResult,
            latencyMs,
        });
        // Update recovery case with AI results
        const newStatus = aiDecision.recoverable
            ? policyResult.requiresHumanApproval
                ? constants_1.RECOVERY_CASE_STATUS.ESCALATED
                : policyResult.approved
                    ? constants_1.RECOVERY_CASE_STATUS.RECOVERABLE
                    : constants_1.RECOVERY_CASE_STATUS.STOPPED
            : constants_1.RECOVERY_CASE_STATUS.NOT_RECOVERABLE;
        await RecoveryCase_1.RecoveryCase.findByIdAndUpdate(recoveryCaseId, {
            status: newStatus,
            recoveryProbability: aiDecision.recoveryProbability,
            riskLevel: aiDecision.riskLevel,
            priority: aiDecision.priority,
            recommendedAction: aiDecision.recommendedAction,
            reasoning: aiDecision.reason,
            aiDecisionId: aiDecisionDoc._id,
            requiresHumanApproval: policyResult.requiresHumanApproval,
            maxAttempts: aiDecision.maxAttempts,
            stopConditions: aiDecision.stopConditions,
            currentStage: 'AI_ANALYZED',
        });
        // Audit log
        await auditService_1.auditService.log({
            merchantId: recoveryCase.merchantId,
            actorType: constants_1.ACTOR_TYPE.AI,
            actorId: this.provider.name,
            action: 'AI_RECOVERY_ANALYSIS',
            entityType: 'RecoveryCase',
            entityId: recoveryCaseId,
            after: {
                probability: aiDecision.recoveryProbability,
                action: aiDecision.recommendedAction,
                policyApproved: policyResult.approved,
                latencyMs,
            },
        });
        logger_1.logger.info('RecoveryAgent: Analysis complete', {
            recoveryCaseId,
            probability: aiDecision.recoveryProbability,
            action: aiDecision.recommendedAction,
            policyApproved: policyResult.approved,
            latencyMs,
        });
        return {
            decision: aiDecision,
            policyResult,
            aiDecisionId: aiDecisionDoc._id.toString(),
        };
    }
}
exports.RecoveryAgent = RecoveryAgent;
exports.recoveryAgent = new RecoveryAgent();
//# sourceMappingURL=RecoveryAgent.js.map