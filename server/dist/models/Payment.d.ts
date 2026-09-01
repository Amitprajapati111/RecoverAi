import { Document, Types } from 'mongoose';
import { PAYMENT_STATUS, FAILURE_TYPE } from '../config/constants';
export type PaymentStatus = keyof typeof PAYMENT_STATUS;
export type FailureType = keyof typeof FAILURE_TYPE;
export interface IPayment extends Document {
    merchantId: Types.ObjectId;
    customerId?: Types.ObjectId;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    amount: number;
    currency: string;
    status: string;
    method?: string;
    failureReason?: string;
    failureCode?: string;
    failureType?: FailureType;
    capturedAt?: Date;
    failedAt?: Date;
    metadata?: Record<string, unknown>;
    isSimulated: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Payment: import("mongoose").Model<IPayment, {}, {}, {}, Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Payment.d.ts.map