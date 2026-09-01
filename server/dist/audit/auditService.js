"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = void 0;
const AuditLog_1 = require("../models/AuditLog");
const logger_1 = require("../utils/logger");
class AuditService {
    async log(entry) {
        try {
            await AuditLog_1.AuditLog.create(entry);
        }
        catch (error) {
            // Audit logging must never crash the main flow
            logger_1.logger.error('AuditService: Failed to write audit log', { error, entry });
        }
    }
    async getForEntity(merchantId, entityType, entityId, limit = 50) {
        return AuditLog_1.AuditLog.find({ merchantId, entityType, entityId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }
    async getForMerchant(merchantId, page = 1, limit = 20, filters) {
        const query = { merchantId };
        if (filters?.actorType)
            query.actorType = filters.actorType;
        if (filters?.action)
            query.action = { $regex: filters.action, $options: 'i' };
        const [logs, total] = await Promise.all([
            AuditLog_1.AuditLog.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            AuditLog_1.AuditLog.countDocuments(query),
        ]);
        return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
}
exports.auditService = new AuditService();
//# sourceMappingURL=auditService.js.map