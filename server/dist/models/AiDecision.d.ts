import { Document, Types } from 'mongoose';
export interface IAiDecision {
    _id?: Types.ObjectId;
    merchantId: Types.ObjectId;
    recoveryCaseId: Types.ObjectId;
    model: string;
    promptVersion: string;
    inputContext: Record<string, unknown>;
    decision: {
        recoverable: boolean;
        recoveryProbability: number;
        riskLevel: string;
        priority: string;
        recommendedAction: string;
        delayMinutes: number;
        maxAttempts: number;
        reason: string;
        requiresHumanApproval: boolean;
        stopConditions: string[];
    };
    confidence: number;
    reasoning: string;
    policyResult: {
        approved: boolean;
        blockedReason?: string;
        requiresApproval?: boolean;
    };
    executionResult?: {
        success: boolean;
        actionTaken?: string;
        error?: string;
    };
    latencyMs: number;
    tokenUsage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    createdAt: Date;
}
export declare const AiDecision: import("mongoose").Model<IAiDecision, {}, {}, {}, Document<unknown, {}, IAiDecision, {}, {}> & IAiDecision & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=AiDecision.d.ts.map