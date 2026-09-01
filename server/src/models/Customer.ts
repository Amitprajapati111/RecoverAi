import { Schema, model, Document, Types } from 'mongoose';
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
  totalRevenue: number; // in paise
  averageOrderValue: number; // in paise
  lastPaymentAt?: Date;
  recoveryScore: number; // 0-100
  customerSegment: CustomerSegment;
  optedOutOfRecovery: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    externalCustomerId: String,
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: String,
    totalPayments: { type: Number, default: 0 },
    successfulPayments: { type: Number, default: 0 },
    failedPayments: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    lastPaymentAt: Date,
    recoveryScore: { type: Number, default: 50, min: 0, max: 100 },
    customerSegment: {
      type: String,
      enum: Object.values(CUSTOMER_SEGMENT),
      default: CUSTOMER_SEGMENT.NEW,
    },
    optedOutOfRecovery: { type: Boolean, default: false },
  },
  { timestamps: true }
);

customerSchema.index({ merchantId: 1 });
customerSchema.index({ merchantId: 1, email: 1 });
customerSchema.index({ merchantId: 1, externalCustomerId: 1 });
customerSchema.index({ merchantId: 1, customerSegment: 1 });

export const Customer = model<ICustomer>('Customer', customerSchema);
