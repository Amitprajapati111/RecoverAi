"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePolicy = exports.getPolicy = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const RecoveryPolicy_1 = require("../models/RecoveryPolicy");
const constants_1 = require("../config/constants");
const auditService_1 = require("../audit/auditService");
const constants_2 = require("../config/constants");
exports.getPolicy = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    let policy = await RecoveryPolicy_1.RecoveryPolicy.findOne({ merchantId });
    if (!policy) {
        policy = await RecoveryPolicy_1.RecoveryPolicy.create({ merchantId, ...constants_1.DEFAULT_POLICY });
    }
    (0, apiResponse_1.sendSuccess)(res, policy);
});
exports.updatePolicy = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const userId = req.user.userId;
    let policy = await RecoveryPolicy_1.RecoveryPolicy.findOneAndUpdate({ merchantId }, { ...req.body }, { new: true, upsert: true });
    await auditService_1.auditService.log({
        merchantId,
        actorType: constants_2.ACTOR_TYPE.USER,
        actorId: userId,
        action: 'POLICY_UPDATED',
        entityType: 'RecoveryPolicy',
        entityId: policy._id.toString(),
        after: req.body,
    });
    (0, apiResponse_1.sendSuccess)(res, policy);
});
//# sourceMappingURL=policy.controller.js.map