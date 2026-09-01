import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, errors } from '../utils/apiResponse';
import { Merchant } from '../models/Merchant';
import { encrypt } from '../utils/encryption';
import { auditService } from '../audit/auditService';
import { ACTOR_TYPE } from '../config/constants';

export const getMerchantProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;

  const merchant = await Merchant.findById(merchantId).lean();
  if (!merchant) throw errors.notFound('Merchant');

  // Hide encrypted secret in response
  const sanitized = { ...merchant, razorpayKeySecret: merchant.razorpayKeySecret ? '••••••••••••••••' : '' };

  sendSuccess(res, sanitized);
});

export const updateMerchantProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const userId = req.user!.userId;
  const { businessName, phone, timezone, currency, notificationSettings, featureFlags, recoverySettings } = req.body;

  const updateData: Record<string, unknown> = {};
  if (businessName) updateData.businessName = businessName;
  if (phone) updateData.phone = phone;
  if (timezone) updateData.timezone = timezone;
  if (currency) updateData.currency = currency;
  if (notificationSettings) updateData.notificationSettings = notificationSettings;
  if (featureFlags) updateData.featureFlags = featureFlags;
  if (recoverySettings) updateData.recoverySettings = recoverySettings;

  const updated = await Merchant.findByIdAndUpdate(merchantId, updateData, { new: true });

  await auditService.log({
    merchantId,
    actorType: ACTOR_TYPE.USER,
    actorId: userId,
    action: 'MERCHANT_SETTINGS_UPDATED',
    entityType: 'Merchant',
    entityId: merchantId,
    after: updateData,
  });

  sendSuccess(res, updated);
});

export const updateRazorpayCredentials = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const userId = req.user!.userId;
  const { razorpayKeyId, razorpayKeySecret, razorpayEnvironment } = req.body;

  const updateData: Record<string, unknown> = {};
  if (razorpayKeyId) updateData.razorpayKeyId = razorpayKeyId;
  if (razorpayKeySecret) updateData.razorpayKeySecret = encrypt(razorpayKeySecret);
  if (razorpayEnvironment) updateData.razorpayEnvironment = razorpayEnvironment;

  await Merchant.findByIdAndUpdate(merchantId, updateData);

  await auditService.log({
    merchantId,
    actorType: ACTOR_TYPE.USER,
    actorId: userId,
    action: 'RAZORPAY_CREDENTIALS_CONFIGURED',
    entityType: 'Merchant',
    entityId: merchantId,
    metadata: { keyId: razorpayKeyId, environment: razorpayEnvironment },
  });

  sendSuccess(res, { message: 'Razorpay credentials saved securely' });
});
