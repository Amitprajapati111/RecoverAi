import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, errors } from '../utils/apiResponse';
import { recoveryService } from '../services/recovery.service';
import { RecoveryCase } from '../models/RecoveryCase';
import { RecoveryAttempt } from '../models/RecoveryAttempt';
import { auditService } from '../audit/auditService';
import { ACTOR_TYPE, RECOVERY_CASE_STATUS, PAGINATION } from '../config/constants';

export const getCases = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const { status, priority } = req.query as { status?: string; priority?: string };

  const result = await recoveryService.getCases(merchantId, page, limit, { status, priority });
  sendSuccess(res, result.cases, 200, {
    page,
    limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

export const getCaseById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const merchantId = req.user!.merchantId;

  const recoveryCase = await RecoveryCase.findOne({ _id: id, merchantId })
    .populate('paymentId')
    .populate('customerId', 'name email phone recoveryScore customerSegment')
    .populate('aiDecisionId')
    .lean();

  if (!recoveryCase) throw errors.notFound('Recovery Case');

  const attempts = await RecoveryAttempt.find({ recoveryCaseId: id, merchantId })
    .sort({ createdAt: -1 })
    .lean();

  const auditLogs = await auditService.getForEntity(merchantId, 'RecoveryCase', id);

  sendSuccess(res, { recoveryCase, attempts, auditTrail: auditLogs });
});

export const triggerAnalysis = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const merchantId = req.user!.merchantId;

  const recoveryCase = await RecoveryCase.findOne({ _id: id, merchantId });
  if (!recoveryCase) throw errors.notFound('Recovery Case');

  await recoveryService.analyzeWithAI(id);
  const updated = await RecoveryCase.findById(id).lean();

  sendSuccess(res, { recoveryCase: updated, message: 'AI analysis triggered successfully' });
});

export const approveAction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const merchantId = req.user!.merchantId;
  const userId = req.user!.userId;

  const recoveryCase = await RecoveryCase.findOne({ _id: id, merchantId });
  if (!recoveryCase) throw errors.notFound('Recovery Case');
  if (!recoveryCase.requiresHumanApproval) {
    throw errors.badRequest('This case does not require human approval');
  }

  await RecoveryCase.findByIdAndUpdate(id, {
    requiresHumanApproval: false,
    approvedBy: userId,
    approvedAt: new Date(),
    status: RECOVERY_CASE_STATUS.RECOVERABLE,
  });

  // Execute the recommended action
  const result = await recoveryService.executeAction(
    id,
    recoveryCase.recommendedAction!,
    0
  );

  await auditService.log({
    merchantId,
    actorType: ACTOR_TYPE.USER,
    actorId: userId,
    action: 'HUMAN_APPROVED_RECOVERY',
    entityType: 'RecoveryCase',
    entityId: id,
    after: result,
  });

  sendSuccess(res, { result, message: 'Recovery action approved and executed' });
});

export const rejectAction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const merchantId = req.user!.merchantId;
  const userId = req.user!.userId;
  const { reason } = req.body;

  const recoveryCase = await RecoveryCase.findOne({ _id: id, merchantId });
  if (!recoveryCase) throw errors.notFound('Recovery Case');

  await RecoveryCase.findByIdAndUpdate(id, {
    status: RECOVERY_CASE_STATUS.STOPPED,
    requiresHumanApproval: false,
    rejectedBy: userId,
    rejectedAt: new Date(),
    rejectionReason: reason || 'Rejected by merchant',
  });

  await auditService.log({
    merchantId,
    actorType: ACTOR_TYPE.USER,
    actorId: userId,
    action: 'HUMAN_REJECTED_RECOVERY',
    entityType: 'RecoveryCase',
    entityId: id,
    reason,
  });

  sendSuccess(res, { message: 'Recovery action rejected' });
});

export const stopRecovery = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const merchantId = req.user!.merchantId;

  const recoveryCase = await RecoveryCase.findOne({ _id: id, merchantId });
  if (!recoveryCase) throw errors.notFound('Recovery Case');

  await RecoveryCase.findByIdAndUpdate(id, {
    status: RECOVERY_CASE_STATUS.STOPPED,
    currentStage: 'MANUALLY_STOPPED',
  });

  sendSuccess(res, { message: 'Recovery stopped' });
});
