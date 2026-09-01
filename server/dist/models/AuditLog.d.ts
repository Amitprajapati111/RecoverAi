import { Document, Types } from 'mongoose';
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
export declare const AuditLog: import("mongoose").Model<IAuditLog, {}, {}, {}, Document<unknown, {}, IAuditLog, {}, {}> & IAuditLog & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=AuditLog.d.ts.map