import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, errors } from '../utils/apiResponse';
import { Campaign } from '../models/Campaign';
import { PAGINATION } from '../config/constants';

export const getCampaigns = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

  let campaigns = await Campaign.find({ merchantId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  let total = await Campaign.countDocuments({ merchantId });

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
    await Campaign.insertMany(defaultCampaigns);
    campaigns = await Campaign.find({ merchantId }).lean();
    total = campaigns.length;
  }

  sendSuccess(res, campaigns, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

export const createCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const { name, description, triggerCondition, actions, maxAttempts, stopConditions } = req.body;

  if (!name) throw errors.badRequest('Campaign name is required');

  const campaign = await Campaign.create({
    merchantId,
    name,
    description,
    triggerCondition: triggerCondition || {},
    actions: actions || [{ actionType: 'CREATE_PAYMENT_LINK', delayMinutes: 15 }],
    maxAttempts: maxAttempts || 2,
    stopConditions: stopConditions || ['payment_success', 'max_attempts_reached'],
    isActive: true,
  });

  sendSuccess(res, campaign, 201);
});

export const updateCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const merchantId = req.user!.merchantId;

  const campaign = await Campaign.findOneAndUpdate(
    { _id: id, merchantId },
    req.body,
    { new: true }
  );

  if (!campaign) throw errors.notFound('Campaign');

  sendSuccess(res, campaign);
});

export const toggleCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const merchantId = req.user!.merchantId;

  const campaign = await Campaign.findOne({ _id: id, merchantId });
  if (!campaign) throw errors.notFound('Campaign');

  campaign.isActive = !campaign.isActive;
  await campaign.save();

  sendSuccess(res, campaign);
});
