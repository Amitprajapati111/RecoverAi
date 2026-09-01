"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../config/constants");
const auditLogSchema = new mongoose_1.Schema({
    merchantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    actorType: { type: String, enum: Object.values(constants_1.ACTOR_TYPE), required: true },
    actorId: String,
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: String,
    before: { type: mongoose_1.Schema.Types.Mixed },
    after: { type: mongoose_1.Schema.Types.Mixed },
    reason: String,
    ipAddress: String,
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });
auditLogSchema.index({ merchantId: 1, createdAt: -1 });
auditLogSchema.index({ merchantId: 1, entityType: 1, entityId: 1 });
auditLogSchema.index({ merchantId: 1, actorType: 1 });
exports.AuditLog = (0, mongoose_1.model)('AuditLog', auditLogSchema);
//# sourceMappingURL=AuditLog.js.map