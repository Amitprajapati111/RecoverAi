/**
 * AI Decision output — strict structured JSON
 * The AI must return this exact shape. Never parse natural language.
 */
export interface AIDecisionOutput {
    recoverable: boolean;
    recoveryProbability: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendedAction: 'RETRY_ELIGIBLE_PAYMENT' | 'CREATE_PAYMENT_LINK' | 'SEND_REMINDER' | 'SCHEDULE_RETRY' | 'REQUEST_CUSTOMER_ACTION' | 'ESCALATE_TO_HUMAN' | 'STOP';
    delayMinutes: number;
    maxAttempts: number;
    reason: string;
    decisionFactors: string[];
    requiresHumanApproval: boolean;
    stopConditions: string[];
    confidence: number;
}
export interface AIContext {
    payment: {
        amount: number;
        currency: string;
        method: string;
        failureReason: string;
        failureCode: string;
        failureType: string;
    };
    customer: {
        segment: string;
        recoveryScore: number;
        totalPayments: number;
        successfulPayments: number;
        failedPayments: number;
        averageOrderValue: number;
    };
    recoveryCase: {
        attemptCount: number;
        maxAttempts: number;
    };
    policy: {
        minimumRecoveryProbability: number;
        requireApprovalAboveAmount: number;
        allowedActions: string[];
        maxAttempts: number;
    };
}
/**
 * Abstract AI Provider — all providers must implement this interface.
 * The AI cannot directly call Razorpay APIs — it only produces decisions.
 */
export declare abstract class AIProvider {
    abstract readonly name: string;
    abstract readonly version: string;
    abstract analyzeForRecovery(context: AIContext): Promise<AIDecisionOutput>;
    abstract isAvailable(): Promise<boolean>;
}
//# sourceMappingURL=AIProvider.d.ts.map