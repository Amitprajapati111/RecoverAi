import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, errors } from '../utils/apiResponse';
import { Payment } from '../models/Payment';
import { RecoveryCase } from '../models/RecoveryCase';
import { auditService } from '../audit/auditService';
import { PAGINATION, PAYMENT_STATUS } from '../config/constants';

export const getPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const { status, method, failureType, search } = req.query as {
    status?: string;
    method?: string;
    failureType?: string;
    search?: string;
  };

  const query: Record<string, unknown> = { merchantId };
  if (status) query.status = status;
  if (method) query.method = method;
  if (failureType) query.failureType = failureType;
  if (search) {
    query.$or = [
      { razorpayPaymentId: { $regex: search, $options: 'i' } },
      { razorpayOrderId: { $regex: search, $options: 'i' } },
      { failureReason: { $regex: search, $options: 'i' } },
    ];
  }

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('customerId', 'name email phone recoveryScore customerSegment')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Payment.countDocuments(query),
  ]);

  sendSuccess(res, payments, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

export const getFailedPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

  const query = { merchantId, status: PAYMENT_STATUS.FAILED };

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('customerId', 'name email phone recoveryScore customerSegment')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Payment.countDocuments(query),
  ]);

  sendSuccess(res, payments, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

export const getPaymentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const merchantId = req.user!.merchantId;

  const payment = await Payment.findOne({ _id: id, merchantId })
    .populate('customerId')
    .lean();

  if (!payment) throw errors.notFound('Payment');

  const recoveryCase = await RecoveryCase.findOne({ paymentId: id })
    .populate('aiDecisionId')
    .lean();

  const auditLogs = await auditService.getForEntity(merchantId, 'Payment', id);

  sendSuccess(res, { payment, recoveryCase, auditTrail: auditLogs });
});
