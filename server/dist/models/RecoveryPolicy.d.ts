import { Document, Types } from 'mongoose';
export interface IRecoveryPolicy extends Document {
    merchantId: Types.ObjectId;
    maxAttempts: number;
    maxAmountPerAction: number;
    minimumRecoveryProbability: number;
    cooldownMinutes: number;
    allowedActions: string[];
    allowedChannels: string[];
    requireApprovalAboveAmount: number;
    stopAfterSuccessfulPayment: boolean;
    stopAfterMaxAttempts: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const RecoveryPolicy: import("mongoose").Model<IRecoveryPolicy, {}, {}, {}, Document<unknown, {}, IRecoveryPolicy, {}, {}> & IRecoveryPolicy & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=RecoveryPolicy.d.ts.map