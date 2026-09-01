import { IRecoveryPolicy } from '../models/RecoveryPolicy';
import { IRecoveryCase } from '../models/RecoveryCase';
import { ICustomer } from '../models/Customer';
import { AIDecisionOutput } from '../ai/providers/AIProvider';
export interface PolicyCheckResult {
    approved: boolean;
    requiresHumanApproval: boolean;
    blockedReason?: string;
    action: AIDecisionOutput['recommendedAction'];
}
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
export declare class PolicyEngine {
    evaluate(aiDecision: AIDecisionOutput, recoveryCase: IRecoveryCase, customer: ICustomer | null, policy: IRecoveryPolicy, lastAttemptAt?: Date): PolicyCheckResult;
    private block;
}
export declare const policyEngine: PolicyEngine;
//# sourceMappingURL=PolicyEngine.d.ts.map