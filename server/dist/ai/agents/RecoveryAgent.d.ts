import { AIDecisionOutput } from '../providers/AIProvider';
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
export declare class RecoveryAgent {
    private provider;
    constructor();
    private initProvider;
    analyze(recoveryCaseId: string): Promise<{
        decision: AIDecisionOutput;
        policyResult: {
            approved: boolean;
            requiresHumanApproval: boolean;
            blockedReason?: string;
            action: string;
        };
        aiDecisionId: string;
    }>;
}
export declare const recoveryAgent: RecoveryAgent;
//# sourceMappingURL=RecoveryAgent.d.ts.map