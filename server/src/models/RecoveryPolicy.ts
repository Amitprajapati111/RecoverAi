import { Schema, model, Document, Types } from 'mongoose';
import { RECOVERY_ACTION, DEFAULT_POLICY } from '../config/constants';

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

const recoveryPolicySchema = new Schema<IRecoveryPolicy>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, unique: true },
    maxAttempts: { type: Number, default: DEFAULT_POLICY.maxAttempts },
    maxAmountPerAction: { type: Number, default: DEFAULT_POLICY.maxAmountPerAction },
    minimumRecoveryProbability: { type: Number, default: DEFAULT_POLICY.minimumRecoveryProbability },
    cooldownMinutes: { type: Number, default: DEFAULT_POLICY.cooldownMinutes },
    allowedActions: {
      type: [{ type: String, enum: Object.values(RECOVERY_ACTION) }],
      default: DEFAULT_POLICY.allowedActions as any,
    },
    allowedChannels: { type: [String], default: ['email', 'sms', 'whatsapp'] },
    requireApprovalAboveAmount: {
      type: Number,
      default: DEFAULT_POLICY.requireApprovalAboveAmount,
    },
    stopAfterSuccessfulPayment: { type: Boolean, default: true },
    stopAfterMaxAttempts: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

recoveryPolicySchema.index({ merchantId: 1 }, { unique: true });

export const RecoveryPolicy = model<IRecoveryPolicy>('RecoveryPolicy', recoveryPolicySchema);
