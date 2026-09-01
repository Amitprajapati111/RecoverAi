import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { RecoveryPolicy } from '../models/RecoveryPolicy';
import { DEFAULT_POLICY } from '../config/constants';
import { auditService } from '../audit/auditService';
import { ACTOR_TYPE } from '../config/constants';

export const getPolicy = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;

  let policy = await RecoveryPolicy.findOne({ merchantId });
  if (!policy) {
    policy = await RecoveryPolicy.create({ merchantId, ...DEFAULT_POLICY });
  }

  sendSuccess(res, policy);
});

export const updatePolicy = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const userId = req.user!.userId;

  let policy = await RecoveryPolicy.findOneAndUpdate(
    { merchantId },
    { ...req.body },
    { new: true, upsert: true }
  );

  await auditService.log({
    merchantId,
    actorType: ACTOR_TYPE.USER,
    actorId: userId,
    action: 'POLICY_UPDATED',
    entityType: 'RecoveryPolicy',
    entityId: (policy._id as any).toString(),
    after: req.body,
  });

  sendSuccess(res, policy);
});
