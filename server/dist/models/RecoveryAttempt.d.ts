import { Document, Types } from 'mongoose';
export interface IRecoveryAttempt extends Document {
    merchantId: Types.ObjectId;
    recoveryCaseId: Types.ObjectId;
    action: string;
    channel?: string;
    status: 'SCHEDULED' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
    attemptNumber: number;
    idempotencyKey: string;
    scheduledAt?: Date;
    executedAt?: Date;
    result?: Record<string, unknown>;
    failureReason?: string;
    recoveredAmount?: number;
    paymentLinkId?: string;
    paymentLinkUrl?: string;
    isSimulated: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const RecoveryAttempt: import("mongoose").Model<IRecoveryAttempt, {}, {}, {}, Document<unknown, {}, IRecoveryAttempt, {}, {}> & IRecoveryAttempt & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=RecoveryAttempt.d.ts.map