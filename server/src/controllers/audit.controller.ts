import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { auditService } from '../audit/auditService';
import { PAGINATION } from '../config/constants';

export const getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const { actorType, action } = req.query as { actorType?: string; action?: string };

  const result = await auditService.getForMerchant(merchantId, page, limit, { actorType, action });

  sendSuccess(res, result.logs, 200, {
    page,
    limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});
