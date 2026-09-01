import { Document, Types } from 'mongoose';
import { RECOVERY_CASE_STATUS, RECOVERY_ACTION, RISK_LEVEL, PRIORITY } from '../config/constants';
export type RecoveryCaseStatus = keyof typeof RECOVERY_CASE_STATUS;
export type RecoveryAction = keyof typeof RECOVERY_ACTION;
export type RiskLevel = keyof typeof RISK_LEVEL;
export type Priority = keyof typeof PRIORITY;
export interface IRecoveryCase extends Document {
    merchantId: Types.ObjectId;
    paymentId: Types.ObjectId;
    customerId?: Types.ObjectId;
    amountAtRisk: number;
    recoveryProbability: number;
    riskLevel: RiskLevel;
    priority: Priority;
    status: RecoveryCaseStatus;
    currentStage: string;
    recommendedAction?: RecoveryAction;
    selectedAction?: RecoveryAction;
    reasoning?: string;
    aiDecisionId?: Types.ObjectId;
    attemptCount: number;
    maxAttempts: number;
    nextActionAt?: Date;
    recoveredAmount?: number;
    requiresHumanApproval: boolean;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    rejectedBy?: Types.ObjectId;
    rejectedAt?: Date;
    rejectionReason?: string;
    stopConditions: string[];
    isSimulated: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const RecoveryCase: import("mongoose").Model<IRecoveryCase, {}, {}, {}, Document<unknown, {}, IRecoveryCase, {}, {}> & IRecoveryCase & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=RecoveryCase.d.ts.map