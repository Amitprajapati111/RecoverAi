import { Schema, model, Document, Types } from 'mongoose';
import { ACTOR_TYPE } from '../config/constants';

export type ActorType = keyof typeof ACTOR_TYPE;

export interface IAuditLog extends Document {
  merchantId: Types.ObjectId;
  actorType: ActorType;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    actorType: { type: String, enum: Object.values(ACTOR_TYPE), required: true },
    actorId: String,
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: String,
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    reason: String,
    ipAddress: String,
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ merchantId: 1, createdAt: -1 });
auditLogSchema.index({ merchantId: 1, entityType: 1, entityId: 1 });
auditLogSchema.index({ merchantId: 1, actorType: 1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
