import { Schema, model, Document, Types } from 'mongoose';

export interface ICampaign extends Document {
  merchantId: Types.ObjectId;
  name: string;
  description?: string;
  triggerCondition: {
    minAmount?: number;
    maxAmount?: number;
    failureTypes?: string[];
    customerSegments?: string[];
    minRecoveryProbability?: number;
  };
  actions: {
    actionType: string;
    delayMinutes: number;
    channel?: string;
    templateId?: string;
  }[];
  maxAttempts: number;
  stopConditions: string[];
  isActive: boolean;
  metrics: {
    totalTriggered: number;
    totalRecovered: number;
    recoveredRevenue: number;
    recoveryRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    name: { type: String, required: true, trim: true },
    description: String,
    triggerCondition: {
      minAmount: { type: Number, default: 0 },
      maxAmount: Number,
      failureTypes: [String],
      customerSegments: [String],
      minRecoveryProbability: { type: Number, default: 0.6 },
    },
    actions: [
      {
        actionType: { type: String, required: true },
        delayMinutes: { type: Number, default: 15 },
        channel: { type: String, default: 'email' },
        templateId: String,
      },
    ],
    maxAttempts: { type: Number, default: 2 },
    stopConditions: { type: [String], default: ['payment_success', 'max_attempts_reached'] },
    isActive: { type: Boolean, default: true },
    metrics: {
      totalTriggered: { type: Number, default: 0 },
      totalRecovered: { type: Number, default: 0 },
      recoveredRevenue: { type: Number, default: 0 },
      recoveryRate: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

campaignSchema.index({ merchantId: 1 });
campaignSchema.index({ merchantId: 1, isActive: 1 });

export const Campaign = model<ICampaign>('Campaign', campaignSchema);
