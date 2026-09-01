"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyEngine = exports.PolicyEngine = void 0;
const logger_1 = require("../utils/logger");
/**
 * PolicyEngine — deterministic guardrail layer between AI and Razorpay.
 *
 * The AI recommendation MUST pass through this layer before any action executes.
 * This layer cannot be bypassed. It enforces:
 * - Maximum attempt limits
 * - Minimum recovery probability thresholds
 * - Amount-based human approval requirements
 * - Customer opt-out respect
 * - Action allowlist enforcement
 * - Cooldown enforcement
 */
class PolicyEngine {
    evaluate(aiDecision, recoveryCase, customer, policy, lastAttemptAt) {
        logger_1.logger.info('PolicyEngine: evaluating AI decision', {
            recoveryCaseId: recoveryCase._id,
            recommendedAction: aiDecision.recommendedAction,
            recoveryProbability: aiDecision.recoveryProbability,
        });
        // Rule 1: If customer opted out, always STOP
        if (customer?.optedOutOfRecovery) {
            return this.block('Customer has opted out of recovery communications', policy);
        }
        // Rule 2: If max attempts reached, STOP
        if (recoveryCase.attemptCount >= policy.maxAttempts) {
            return this.block(`Maximum recovery attempts (${policy.maxAttempts}) reached`, policy);
        }
        // Rule 3: If recovery probability below minimum threshold, STOP
        if (aiDecision.recoveryProbability < policy.minimumRecoveryProbability) {
            return this.block(`Recovery probability ${(aiDecision.recoveryProbability * 100).toFixed(0)}% is below minimum threshold ${(policy.minimumRecoveryProbability * 100).toFixed(0)}%`, policy);
        }
        // Rule 4: If action not in allowlist, STOP or escalate
        if (!policy.allowedActions.includes(aiDecision.recommendedAction)) {
            return this.block(`Action '${aiDecision.recommendedAction}' is not in merchant's allowed actions`, policy);
        }
        // Rule 5: Cooldown enforcement
        if (lastAttemptAt) {
            const minutesSinceLastAttempt = (Date.now() - lastAttemptAt.getTime()) / (1000 * 60);
            if (minutesSinceLastAttempt < policy.cooldownMinutes) {
                const remainingMinutes = Math.ceil(policy.cooldownMinutes - minutesSinceLastAttempt);
                return this.block(`Cooldown period active. ${remainingMinutes} minutes remaining before next attempt`, policy);
            }
        }
        // Rule 6: High-value transactions require human approval
        const requiresApproval = recoveryCase.amountAtRisk > policy.requireApprovalAboveAmount ||
            aiDecision.requiresHumanApproval;
        if (requiresApproval) {
            return {
                approved: false, // Not yet — pending human
                requiresHumanApproval: true,
                action: aiDecision.recommendedAction,
            };
        }
        // All checks passed
        return {
            approved: true,
            requiresHumanApproval: false,
            action: aiDecision.recommendedAction,
        };
    }
    block(reason, policy) {
        logger_1.logger.info(`PolicyEngine: BLOCKED — ${reason}`);
        return {
            approved: false,
            requiresHumanApproval: false,
            blockedReason: reason,
            action: 'STOP',
        };
    }
}
exports.PolicyEngine = PolicyEngine;
exports.policyEngine = new PolicyEngine();
//# sourceMappingURL=PolicyEngine.js.map