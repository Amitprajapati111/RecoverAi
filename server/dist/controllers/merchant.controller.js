"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRazorpayCredentials = exports.updateMerchantProfile = exports.getMerchantProfile = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const Merchant_1 = require("../models/Merchant");
const encryption_1 = require("../utils/encryption");
const auditService_1 = require("../audit/auditService");
const constants_1 = require("../config/constants");
exports.getMerchantProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const merchant = await Merchant_1.Merchant.findById(merchantId).lean();
    if (!merchant)
        throw apiResponse_1.errors.notFound('Merchant');
    // Hide encrypted secret in response
    const sanitized = { ...merchant, razorpayKeySecret: merchant.razorpayKeySecret ? '••••••••••••••••' : '' };
    (0, apiResponse_1.sendSuccess)(res, sanitized);
});
exports.updateMerchantProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const userId = req.user.userId;
    const { businessName, phone, timezone, currency, notificationSettings, featureFlags, recoverySettings } = req.body;
    const updateData = {};
    if (businessName)
        updateData.businessName = businessName;
    if (phone)
        updateData.phone = phone;
    if (timezone)
        updateData.timezone = timezone;
    if (currency)
        updateData.currency = currency;
    if (notificationSettings)
        updateData.notificationSettings = notificationSettings;
    if (featureFlags)
        updateData.featureFlags = featureFlags;
    if (recoverySettings)
        updateData.recoverySettings = recoverySettings;
    const updated = await Merchant_1.Merchant.findByIdAndUpdate(merchantId, updateData, { new: true });
    await auditService_1.auditService.log({
        merchantId,
        actorType: constants_1.ACTOR_TYPE.USER,
        actorId: userId,
        action: 'MERCHANT_SETTINGS_UPDATED',
        entityType: 'Merchant',
        entityId: merchantId,
        after: updateData,
    });
    (0, apiResponse_1.sendSuccess)(res, updated);
});
exports.updateRazorpayCredentials = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const userId = req.user.userId;
    const { razorpayKeyId, razorpayKeySecret, razorpayEnvironment } = req.body;
    const updateData = {};
    if (razorpayKeyId)
        updateData.razorpayKeyId = razorpayKeyId;
    if (razorpayKeySecret)
        updateData.razorpayKeySecret = (0, encryption_1.encrypt)(razorpayKeySecret);
    if (razorpayEnvironment)
        updateData.razorpayEnvironment = razorpayEnvironment;
    await Merchant_1.Merchant.findByIdAndUpdate(merchantId, updateData);
    await auditService_1.auditService.log({
        merchantId,
        actorType: constants_1.ACTOR_TYPE.USER,
        actorId: userId,
        action: 'RAZORPAY_CREDENTIALS_CONFIGURED',
        entityType: 'Merchant',
        entityId: merchantId,
        metadata: { keyId: razorpayKeyId, environment: razorpayEnvironment },
    });
    (0, apiResponse_1.sendSuccess)(res, { message: 'Razorpay credentials saved securely' });
});
//# sourceMappingURL=merchant.controller.js.map