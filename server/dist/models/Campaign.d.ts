import { Document, Types } from 'mongoose';
export interface ICampaign extends Document {
    merchantId: Types.ObjectId;
    name: string;
    description?: string;
    triggerCondition: {
        minAmount?: number;
        maxAmount?: number;
        failureTypes?: string[];
        customerSegments?: string[];
        minRecoveryProbability?: number;
    };
    actions: {
        actionType: string;
        delayMinutes: number;
        channel?: string;
        templateId?: string;
    }[];
    maxAttempts: number;
    stopConditions: string[];
    isActive: boolean;
    metrics: {
        totalTriggered: number;
        totalRecovered: number;
        recoveredRevenue: number;
        recoveryRate: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const Campaign: import("mongoose").Model<ICampaign, {}, {}, {}, Document<unknown, {}, ICampaign, {}, {}> & ICampaign & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Campaign.d.ts.map