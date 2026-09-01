import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, errors } from '../utils/apiResponse';
import { Customer } from '../models/Customer';
import { Payment } from '../models/Payment';
import { RecoveryCase } from '../models/RecoveryCase';
import { AuditLog } from '../models/AuditLog';
import { PAGINATION } from '../config/constants';

export const getCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const { segment, search } = req.query as { segment?: string; search?: string };

  const query: Record<string, unknown> = { merchantId };
  if (segment) query.customerSegment = segment;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const [customers, total] = await Promise.all([
    Customer.find(query)
      .sort({ totalRevenue: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Customer.countDocuments(query),
  ]);

  sendSuccess(res, customers, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

export const getCustomerById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const merchantId = req.user!.merchantId;

  const customer = await Customer.findOne({ _id: id, merchantId }).lean();
  if (!customer) throw errors.notFound('Customer');

  const [payments, recoveryCases, auditLogs] = await Promise.all([
    Payment.find({ merchantId, customerId: id }).sort({ createdAt: -1 }).limit(20).lean(),
    RecoveryCase.find({ merchantId, customerId: id }).sort({ createdAt: -1 }).limit(10).lean(),
    AuditLog.find({ merchantId, entityType: 'Customer', entityId: id }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  sendSuccess(res, {
    customer,
    payments,
    recoveryCases,
    auditTrail: auditLogs,
  });
});
