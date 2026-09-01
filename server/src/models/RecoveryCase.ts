import { Schema, model, Document, Types } from 'mongoose';
import { RECOVERY_CASE_STATUS, RECOVERY_ACTION, RISK_LEVEL, PRIORITY } from '../config/constants';

export type RecoveryCaseStatus = keyof typeof RECOVERY_CASE_STATUS;
export type RecoveryAction = keyof typeof RECOVERY_ACTION;
export type RiskLevel = keyof typeof RISK_LEVEL;
export type Priority = keyof typeof PRIORITY;

export interface IRecoveryCase extends Document {
  merchantId: Types.ObjectId;
  paymentId: Types.ObjectId;
  customerId?: Types.ObjectId;
  amountAtRisk: number; // in paise
  recoveryProbability: number; // 0-1
  riskLevel: RiskLevel;
  priority: Priority;
  status: RecoveryCaseStatus;
  currentStage: string;
  recommendedAction?: RecoveryAction;
  selectedAction?: RecoveryAction;
  reasoning?: string;
  aiDecisionId?: Types.ObjectId;
  attemptCount: number;
  maxAttempts: number;
  nextActionAt?: Date;
  recoveredAmount?: number;
  recoveredAt?: Date; // Timestamp when recovery was completed
  experimentVariant?: string; // A/B experiment variant assignment
  requiresHumanApproval: boolean;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;
  stopConditions: string[];
  isSimulated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const recoveryCaseSchema = new Schema<IRecoveryCase>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    amountAtRisk: { type: Number, required: true },
    recoveryProbability: { type: Number, default: 0 },
    riskLevel: { type: String, enum: Object.values(RISK_LEVEL), default: RISK_LEVEL.MEDIUM },
    priority: { type: String, enum: Object.values(PRIORITY), default: PRIORITY.MEDIUM },
    status: {
      type: String,
      enum: Object.values(RECOVERY_CASE_STATUS),
      default: RECOVERY_CASE_STATUS.NEW,
    },
    currentStage: { type: String, default: 'CREATED' },
    recommendedAction: { type: String, enum: Object.values(RECOVERY_ACTION) },
    selectedAction: { type: String, enum: Object.values(RECOVERY_ACTION) },
    reasoning: String,
    aiDecisionId: { type: Schema.Types.ObjectId, ref: 'AiDecision' },
    attemptCount: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    nextActionAt: Date,
    recoveredAmount: Number,
    recoveredAt: Date, // Timestamp when recovery was completed
    experimentVariant: String, // A/B experiment variant assignment
    requiresHumanApproval: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionReason: String,
    stopConditions: [String],
    isSimulated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

recoveryCaseSchema.index({ merchantId: 1 });
recoveryCaseSchema.index({ merchantId: 1, status: 1 });
recoveryCaseSchema.index({ merchantId: 1, priority: 1, status: 1 });
recoveryCaseSchema.index({ paymentId: 1 }, { unique: true });
recoveryCaseSchema.index({ merchantId: 1, createdAt: -1 });
recoveryCaseSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
recoveryCaseSchema.index({ merchantId: 1, createdAt: -1, amountAtRisk: 1, recoveredAmount: 1 });

export const RecoveryCase = model<IRecoveryCase>('RecoveryCase', recoveryCaseSchema);
