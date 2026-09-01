import { Types } from 'mongoose';
import { AuditLog, ActorType } from '../models/AuditLog';
import { logger } from '../utils/logger';

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

class AuditService {
  async log(entry: AuditEntry): Promise<void> {
    try {
      await AuditLog.create(entry);
    } catch (error) {
      // Audit logging must never crash the main flow
      logger.error('AuditService: Failed to write audit log', { error, entry });
    }
  }

  async getForEntity(
    merchantId: string,
    entityType: string,
    entityId: string,
    limit = 50
  ) {
    return AuditLog.find({ merchantId, entityType, entityId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getForMerchant(
    merchantId: string,
    page = 1,
    limit = 20,
    filters?: { actorType?: string; action?: string }
  ) {
    const query: Record<string, unknown> = { merchantId };
    if (filters?.actorType) query.actorType = filters.actorType;
    if (filters?.action) query.action = { $regex: filters.action, $options: 'i' };

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export const auditService = new AuditService();
