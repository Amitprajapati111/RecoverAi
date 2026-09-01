import { Schema, model, Document, Types } from 'mongoose';

export interface IMerchant extends Document {
  businessName: string;
  email: string;
  phone?: string;
  razorpayAccountId?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string; // encrypted
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

const merchantSchema = new Schema<IMerchant>(
  {
    businessName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    razorpayAccountId: String,
    razorpayKeyId: String,
    razorpayKeySecret: String, // Stored encrypted
    razorpayEnvironment: { type: String, enum: ['test', 'live'], default: 'test' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    recoverySettings: {
      enabled: { type: Boolean, default: true },
      maxAttempts: { type: Number, default: 3 },
      cooldownMinutes: { type: Number, default: 30 },
      requireApprovalAboveAmount: { type: Number, default: 1000000 }, // ₹10,000 in paise
      minimumRecoveryProbability: { type: Number, default: 0.55 },
    },
    notificationSettings: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
    },
    featureFlags: {
      enableAI: { type: Boolean, default: true },
      enableAutoRecovery: { type: Boolean, default: true },
      enablePaymentLinks: { type: Boolean, default: true },
      enableNotifications: { type: Boolean, default: true },
      enableHinglish: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

merchantSchema.index({ email: 1 }, { unique: true });

export const Merchant = model<IMerchant>('Merchant', merchantSchema);
