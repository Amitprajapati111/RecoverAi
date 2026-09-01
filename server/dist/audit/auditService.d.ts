import { Types } from 'mongoose';
import { ActorType } from '../models/AuditLog';
export interface AuditEntry {
    merchantId: string | Types.ObjectId;
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
}
declare class AuditService {
    log(entry: AuditEntry): Promise<void>;
    getForEntity(merchantId: string, entityType: string, entityId: string, limit?: number): Promise<(import("mongoose").FlattenMaps<import("../models/AuditLog").IAuditLog> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getForMerchant(merchantId: string, page?: number, limit?: number, filters?: {
        actorType?: string;
        action?: string;
    }): Promise<{
        logs: (import("mongoose").FlattenMaps<import("../models/AuditLog").IAuditLog> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
export declare const auditService: AuditService;
export {};
//# sourceMappingURL=auditService.d.ts.map