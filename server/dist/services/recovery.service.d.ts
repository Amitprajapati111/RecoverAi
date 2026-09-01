import { Types } from 'mongoose';
/**
 * RecoveryService — orchestrates the full recovery lifecycle:
 * Detect → Diagnose → Predict → Decide → Act → Verify → Recover → Learn
 */
export declare const recoveryService: {
    /**
     * Called when a payment fails — creates a recovery case and enqueues AI analysis.
     */
    createRecoveryCase(paymentId: string, merchantId: string): Promise<string>;
    /**
     * Trigger AI analysis for a recovery case (can be called directly for manual triggers)
     */
    analyzeWithAI(recoveryCaseId: string): Promise<void>;
    /**
     * Execute a recovery action after policy approval
     */
    executeAction(recoveryCaseId: string, action: string, delayMinutes?: number, clientProvidedKey?: string): Promise<{
        success: boolean;
        result: Record<string, unknown>;
    }>;
    /**
     * Mark a payment as recovered (called when payment_link.paid webhook arrives)
     */
    markRecovered(recoveryCaseId: string, amount: number): Promise<void>;
    /**
     * Get paginated recovery cases for a merchant
     */
    getCases(merchantId: string, page?: number, limit?: number, filters?: {
        status?: string;
        priority?: string;
    }): Promise<{
        cases: (import("mongoose").FlattenMaps<import("../models/RecoveryCase").IRecoveryCase> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
};
//# sourceMappingURL=recovery.service.d.ts.map