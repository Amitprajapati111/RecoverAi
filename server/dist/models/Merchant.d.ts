import { Document, Types } from 'mongoose';
export interface IMerchant extends Document {
    businessName: string;
    email: string;
    phone?: string;
    razorpayAccountId?: string;
    razorpayKeyId?: string;
    razorpayKeySecret?: string;
    razorpayEnvironment: 'test' | 'live';
    timezone: string;
    currency: string;
    recoverySettings: {
        enabled: boolean;
        maxAttempts: number;
        cooldownMinutes: number;
        requireApprovalAboveAmount: number;
        minimumRecoveryProbability: number;
    };
    notificationSettings: {
        email: boolean;
        sms: boolean;
        whatsapp: boolean;
    };
    featureFlags: {
        enableAI: boolean;
        enableAutoRecovery: boolean;
        enablePaymentLinks: boolean;
        enableNotifications: boolean;
        enableHinglish: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const Merchant: import("mongoose").Model<IMerchant, {}, {}, {}, Document<unknown, {}, IMerchant, {}, {}> & IMerchant & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Merchant.d.ts.map