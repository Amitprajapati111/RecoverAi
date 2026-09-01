import { Schema, model, Document, Types } from 'mongoose';
import { PAYMENT_STATUS, FAILURE_TYPE } from '../config/constants';

export type PaymentStatus = keyof typeof PAYMENT_STATUS;
export type FailureType = keyof typeof FAILURE_TYPE;

export interface IPayment extends Document {
  merchantId: Types.ObjectId;
  customerId?: Types.ObjectId;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  amount: number; // in paise
  currency: string;
  status: string;
  method?: string; // upi, card, netbanking, wallet
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

const paymentSchema = new Schema<IPayment>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    razorpayPaymentId: { type: String, sparse: true, index: true },
    razorpayOrderId: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.CREATED,
    },
    method: String,
    failureReason: String,
    failureCode: String,
    failureType: {
      type: String,
      enum: Object.values(FAILURE_TYPE),
    },
    capturedAt: Date,
    failedAt: Date,
    metadata: { type: Schema.Types.Mixed },
    isSimulated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

paymentSchema.index({ merchantId: 1, status: 1 });
paymentSchema.index({ merchantId: 1, customerId: 1 });
paymentSchema.index({ merchantId: 1, createdAt: -1 });
paymentSchema.index({ merchantId: 1, createdAt: -1, status: 1 });
paymentSchema.index({ merchantId: 1, status: 1, failureType: 1, createdAt: -1 });

export const Payment = model<IPayment>('Payment', paymentSchema);
