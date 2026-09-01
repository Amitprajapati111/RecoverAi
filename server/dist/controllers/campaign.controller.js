"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleCampaign = exports.updateCampaign = exports.createCampaign = exports.getCampaigns = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const Campaign_1 = require("../models/Campaign");
const constants_1 = require("../config/constants");
exports.getCampaigns = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const page = parseInt(req.query.page) || constants_1.PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || constants_1.PAGINATION.DEFAULT_LIMIT, constants_1.PAGINATION.MAX_LIMIT);
    let campaigns = await Campaign_1.Campaign.find({ merchantId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    let total = await Campaign_1.Campaign.countDocuments({ merchantId });
    // Seed default demo campaigns if none exist
    if (total === 0) {
        const defaultCampaigns = [
            {
                merchantId,
                name: 'High-Value UPI Recovery Blitz',
                description: 'Auto-generate payment link within 15 min for UPI timeouts over ₹2,000.',
                triggerCondition: { minAmount: 200000, failureTypes: ['UPI_TIMEOUT', 'BANK_TIMEOUT'], minRecoveryProbability: 0.7 },
                actions: [{ actionType: 'CREATE_PAYMENT_LINK', delayMinutes: 15, channel: 'whatsapp' }],
                maxAttempts: 2,
                isActive: true,
                metrics: { totalTriggered: 240, totalRecovered: 168, recoveredRevenue: 84000000, recoveryRate: 70 },
            },
            {
                merchantId,
                name: 'Card Expiry & Mandate Win-Back',
                description: 'Notify loyal customers to update payment method with gentle reminders.',
                triggerCondition: { failureTypes: ['CARD_EXPIRED', 'MANDATE_FAILURE'], customerSegments: ['LOYAL', 'HIGH_VALUE'] },
                actions: [{ actionType: 'REQUEST_CUSTOMER_ACTION', delayMinutes: 30, channel: 'email' }],
                maxAttempts: 3,
                isActive: true,
                metrics: { totalTriggered: 95, totalRecovered: 58, recoveredRevenue: 29000000, recoveryRate: 61.1 },
            },
            {
                merchantId,
                name: 'Instant Cart Abandonment Rescue',
                description: 'Send direct payment link within 10 min for checkout drops.',
                triggerCondition: { failureTypes: ['CUSTOMER_ABANDONED'], minRecoveryProbability: 0.65 },
                actions: [{ actionType: 'CREATE_PAYMENT_LINK', delayMinutes: 10, channel: 'sms' }],
                maxAttempts: 2,
                isActive: true,
                metrics: { totalTriggered: 410, totalRecovered: 215, recoveredRevenue: 53750000, recoveryRate: 52.4 },
            },
        ];
        await Campaign_1.Campaign.insertMany(defaultCampaigns);
        campaigns = await Campaign_1.Campaign.find({ merchantId }).lean();
        total = campaigns.length;
    }
    (0, apiResponse_1.sendSuccess)(res, campaigns, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });
});
exports.createCampaign = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const { name, description, triggerCondition, actions, maxAttempts, stopConditions } = req.body;
    if (!name)
        throw apiResponse_1.errors.badRequest('Campaign name is required');
    const campaign = await Campaign_1.Campaign.create({
        merchantId,
        name,
        description,
        triggerCondition: triggerCondition || {},
        actions: actions || [{ actionType: 'CREATE_PAYMENT_LINK', delayMinutes: 15 }],
        maxAttempts: maxAttempts || 2,
        stopConditions: stopConditions || ['payment_success', 'max_attempts_reached'],
        isActive: true,
    });
    (0, apiResponse_1.sendSuccess)(res, campaign, 201);
});
exports.updateCampaign = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const merchantId = req.user.merchantId;
    const campaign = await Campaign_1.Campaign.findOneAndUpdate({ _id: id, merchantId }, req.body, { new: true });
    if (!campaign)
        throw apiResponse_1.errors.notFound('Campaign');
    (0, apiResponse_1.sendSuccess)(res, campaign);
});
exports.toggleCampaign = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const merchantId = req.user.merchantId;
    const campaign = await Campaign_1.Campaign.findOne({ _id: id, merchantId });
    if (!campaign)
        throw apiResponse_1.errors.notFound('Campaign');
    campaign.isActive = !campaign.isActive;
    await campaign.save();
    (0, apiResponse_1.sendSuccess)(res, campaign);
});
//# sourceMappingURL=campaign.controller.js.map