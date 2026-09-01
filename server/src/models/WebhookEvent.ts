import { Schema, model, Document, Types } from 'mongoose';

export interface IWebhookEvent extends Document {
  merchantId?: Types.ObjectId;
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  signature?: string;
  processed: boolean;
  processingAttempts: number;
  receivedAt: Date;
  processedAt?: Date;
  error?: string;
  jobId?: string;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant' },
    eventId: { type: String, required: true },
    eventType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    signature: String,
    processed: { type: Boolean, default: false },
    processingAttempts: { type: Number, default: 0 },
    receivedAt: { type: Date, default: Date.now },
    processedAt: Date,
    error: String,
    jobId: String,
  },
  {}
);

// Critical: unique index on eventId for idempotency
webhookEventSchema.index({ eventId: 1 }, { unique: true });
webhookEventSchema.index({ eventType: 1 });
webhookEventSchema.index({ processed: 1 });
webhookEventSchema.index({ receivedAt: -1 });

export const WebhookEvent = model<IWebhookEvent>('WebhookEvent', webhookEventSchema);
