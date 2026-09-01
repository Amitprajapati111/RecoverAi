import { Schema, model, Document, Types } from 'mongoose';

export interface IAiDecision {
  _id?: Types.ObjectId;
  merchantId: Types.ObjectId;
  recoveryCaseId: Types.ObjectId;
  model: string;
  promptVersion: string;
  inputContext: Record<string, unknown>;
  decision: {
    recoverable: boolean;
    recoveryProbability: number;
    riskLevel: string;
    priority: string;
    recommendedAction: string;
    delayMinutes: number;
    maxAttempts: number;
    reason: string;
    requiresHumanApproval: boolean;
    stopConditions: string[];
  };
  confidence: number;
  reasoning: string;
  policyResult: {
    approved: boolean;
    blockedReason?: string;
    requiresApproval?: boolean;
  };
  executionResult?: {
    success: boolean;
    actionTaken?: string;
    error?: string;
  };
  latencyMs: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: Date;
}

const aiDecisionSchema = new Schema<IAiDecision>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    recoveryCaseId: { type: Schema.Types.ObjectId, ref: 'RecoveryCase', required: true },
    model: { type: String, required: true },
    promptVersion: { type: String, required: true },
    inputContext: { type: Schema.Types.Mixed },
    decision: {
      recoverable: Boolean,
      recoveryProbability: Number,
      riskLevel: String,
      priority: String,
      recommendedAction: String,
      delayMinutes: Number,
      maxAttempts: Number,
      reason: String,
      requiresHumanApproval: Boolean,
      stopConditions: [String],
    },
    confidence: Number,
    reasoning: String,
    policyResult: {
      approved: Boolean,
      blockedReason: String,
      requiresApproval: Boolean,
    },
    executionResult: {
      success: Boolean,
      actionTaken: String,
      error: String,
    },
    latencyMs: Number,
    tokenUsage: {
      promptTokens: Number,
      completionTokens: Number,
      totalTokens: Number,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

aiDecisionSchema.index({ merchantId: 1 });
aiDecisionSchema.index({ recoveryCaseId: 1 });
aiDecisionSchema.index({ merchantId: 1, createdAt: -1 });

export const AiDecision = model<IAiDecision>('AiDecision', aiDecisionSchema);
