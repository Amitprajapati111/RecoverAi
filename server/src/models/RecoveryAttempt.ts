import { Schema, model, Document, Types } from 'mongoose';
import { RECOVERY_ACTION } from '../config/constants';

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

const recoveryAttemptSchema = new Schema<IRecoveryAttempt>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    recoveryCaseId: { type: Schema.Types.ObjectId, ref: 'RecoveryCase', required: true },
    action: { type: String, enum: Object.values(RECOVERY_ACTION), required: true },
    channel: String,
    status: {
      type: String,
      enum: ['SCHEDULED', 'EXECUTING', 'SUCCESS', 'FAILED', 'CANCELLED'],
      default: 'SCHEDULED',
    },
    attemptNumber: { type: Number, required: true },
    idempotencyKey: { type: String, required: true },
    scheduledAt: Date,
    executedAt: Date,
    result: { type: Schema.Types.Mixed },
    failureReason: String,
    recoveredAmount: Number,
    paymentLinkId: String,
    paymentLinkUrl: String,
    isSimulated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

recoveryAttemptSchema.index({ merchantId: 1 });
recoveryAttemptSchema.index({ recoveryCaseId: 1 });
recoveryAttemptSchema.index({ idempotencyKey: 1 }, { unique: true });

export const RecoveryAttempt = model<IRecoveryAttempt>('RecoveryAttempt', recoveryAttemptSchema);
