import { Document, Types } from 'mongoose';
import { CUSTOMER_SEGMENT } from '../config/constants';
export type CustomerSegment = keyof typeof CUSTOMER_SEGMENT;
export interface ICustomer extends Document {
    merchantId: Types.ObjectId;
    externalCustomerId?: string;
    name: string;
    email: string;
    phone?: string;
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    totalRevenue: number;
    averageOrderValue: number;
    lastPaymentAt?: Date;
    recoveryScore: number;
    customerSegment: CustomerSegment;
    optedOutOfRecovery: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Customer: import("mongoose").Model<ICustomer, {}, {}, {}, Document<unknown, {}, ICustomer, {}, {}> & ICustomer & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Customer.d.ts.map