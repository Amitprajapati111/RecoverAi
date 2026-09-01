import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { RecoveryCase } from '../models/RecoveryCase';
import { PAGINATION, RECOVERY_CASE_STATUS } from '../config/constants';

export const getPendingApprovals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

  const query = {
    merchantId,
    $or: [{ requiresHumanApproval: true }, { status: RECOVERY_CASE_STATUS.ESCALATED }],
  };

  const [cases, total] = await Promise.all([
    RecoveryCase.find(query)
      .populate('paymentId')
      .populate('customerId')
      .populate('aiDecisionId')
      .sort({ amountAtRisk: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    RecoveryCase.countDocuments(query),
  ]);

  sendSuccess(res, cases, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});
