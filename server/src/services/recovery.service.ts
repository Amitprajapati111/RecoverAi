import { Types } from 'mongoose';
import { Payment } from '../models/Payment';
import { Customer } from '../models/Customer';
import { RecoveryCase } from '../models/RecoveryCase';
import { RecoveryAttempt } from '../models/RecoveryAttempt';
import { AiDecision } from '../models/AiDecision';
import { recoveryAgent } from '../ai/agents/RecoveryAgent';
import { paymentLinkService } from '../integrations/razorpay/paymentLinkService';
import { auditService } from '../audit/auditService';
import { generateIdempotencyKey } from '../utils/encryption';
import {
  RECOVERY_CASE_STATUS,
  RECOVERY_ACTION,
  PAYMENT_STATUS,
  ACTOR_TYPE,
  FAILURE_TYPE,
} from '../config/constants';
import { logger } from '../utils/logger';
import { errors } from '../utils/apiResponse';
import { enqueueAIAnalysis } from '../queues/queues';
import { cache } from '../config/redis';

async function invalidateDashboardCache(merchantId: string): Promise<void> {
  try {
    await cache.delPattern(`recoverai:dashboard:${merchantId}:*`);
  } catch {
    // Cache invalidation must not interrupt recovery flow
  }
}

/**
 * RecoveryService — orchestrates the full recovery lifecycle:
 * Detect → Diagnose → Predict → Decide → Act → Verify → Recover → Learn
 */
export const recoveryService = {
  /**
   * Called when a payment fails — creates a recovery case and enqueues AI analysis.
   */
  async createRecoveryCase(
    paymentId: string,
    merchantId: string
  ): Promise<string> {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw errors.notFound('Payment');
    if (payment.status !== PAYMENT_STATUS.FAILED) {
      throw errors.badRequest('Payment is not in failed status');
    }

    // Check if a recovery case already exists for this payment
    const existing = await RecoveryCase.findOne({ paymentId });
    if (existing) {
      return (existing._id as Types.ObjectId).toString();
    }

    // Deterministic pre-checks before AI (cheaper, faster)
    const isHardFailure = [
      FAILURE_TYPE.UNKNOWN, // Can still recover
    ].includes(payment.failureType as any);

    const recoveryCase = await RecoveryCase.create({
      merchantId,
      paymentId,
      customerId: payment.customerId,
      amountAtRisk: payment.amount,
      status: RECOVERY_CASE_STATUS.NEW,
      currentStage: 'CREATED',
      isSimulated: payment.isSimulated,
    });

    const caseId = (recoveryCase._id as Types.ObjectId).toString();

    await auditService.log({
      merchantId,
      actorType: ACTOR_TYPE.SYSTEM,
      action: 'RECOVERY_CASE_CREATED',
      entityType: 'RecoveryCase',
      entityId: caseId,
      after: { paymentId, amountAtRisk: payment.amount },
    });

    await invalidateDashboardCache(merchantId);

    // Enqueue AI analysis (async)
    await enqueueAIAnalysis({ recoveryCaseId: caseId, merchantId });

    return caseId;
  },

  /**
   * Trigger AI analysis for a recovery case (can be called directly for manual triggers)
   */
  async analyzeWithAI(recoveryCaseId: string): Promise<void> {
    const { decision, policyResult } = await recoveryAgent.analyze(recoveryCaseId);

    // If approved and not waiting for human, execute the action
    if (policyResult.approved && !policyResult.requiresHumanApproval) {
      const recoveryCase = await RecoveryCase.findById(recoveryCaseId);
      if (recoveryCase) {
        await this.executeAction(recoveryCaseId, decision.recommendedAction, decision.delayMinutes);
      }
    }
  },

  /**
   * Execute a recovery action after policy approval
   */
  async executeAction(
    recoveryCaseId: string,
    action: string,
    delayMinutes = 0,
    clientProvidedKey?: string
  ): Promise<{ success: boolean; result: Record<string, unknown> }> {
    const recoveryCase = await RecoveryCase.findById(recoveryCaseId)
      .populate('customerId');
    if (!recoveryCase) throw errors.notFound('Recovery Case');

    const payment = await Payment.findById(recoveryCase.paymentId);
    if (!payment) throw errors.notFound('Payment');

    // Idempotency check: prevent duplicate execution if case is already active with this action
    if (
      recoveryCase.status === RECOVERY_CASE_STATUS.IN_RECOVERY &&
      recoveryCase.selectedAction === action &&
      recoveryCase.currentStage === `${action}_EXECUTED`
    ) {
      logger.info('Recovery action already active on case (idempotency)', { recoveryCaseId, action });
      const lastAttempt = await RecoveryAttempt.findOne({ recoveryCaseId, action }).sort({ createdAt: -1 });
      return {
        success: true,
        result: {
          duplicate: true,
          paymentLinkId: lastAttempt?.paymentLinkId,
          paymentLinkUrl: lastAttempt?.paymentLinkUrl,
        },
      };
    }

    // Idempotency key check
    const idempotencyKey =
      clientProvidedKey ||
      generateIdempotencyKey(
        recoveryCaseId,
        action,
        recoveryCase.attemptCount.toString()
      );

    const existingAttempt = await RecoveryAttempt.findOne({ idempotencyKey });
    if (existingAttempt) {
      logger.info('Recovery action already executed (idempotency)', { idempotencyKey });
      return {
        success: true,
        result: {
          duplicate: true,
          paymentLinkId: existingAttempt.paymentLinkId,
          paymentLinkUrl: existingAttempt.paymentLinkUrl,
        },
      };
    }

    // Create attempt record
    const attempt = await RecoveryAttempt.create({
      merchantId: recoveryCase.merchantId,
      recoveryCaseId,
      action,
      status: 'EXECUTING',
      attemptNumber: recoveryCase.attemptCount + 1,
      idempotencyKey,
      executedAt: new Date(),
      isSimulated: recoveryCase.isSimulated,
    });

    let result: Record<string, unknown> = {};
    let success = false;

    try {
      switch (action) {
        case RECOVERY_ACTION.CREATE_PAYMENT_LINK: {
          const customer = recoveryCase.customerId as any;
          const link = await paymentLinkService.create({
            amount: payment.amount,
            currency: payment.currency,
            description: `Payment Recovery - ${payment.razorpayOrderId || 'RecoverAI'}`,
            customerName: customer?.name,
            customerEmail: customer?.email,
            customerPhone: customer?.phone,
            referenceId: `recovery-${recoveryCaseId}`,
            expiryMinutes: 24 * 60, // 24 hours
            notes: { recoveryCaseId, source: 'RecoverAI' },
          });

          await RecoveryAttempt.findByIdAndUpdate(attempt._id, {
            status: 'SUCCESS',
            paymentLinkId: link.id,
            paymentLinkUrl: link.short_url,
            result: link,
          });

          result = { paymentLinkId: link.id, paymentLinkUrl: link.short_url, isSimulated: link.isSimulated };
          success = true;
          break;
        }

        case RECOVERY_ACTION.SEND_REMINDER: {
          // TODO: Integrate real notification service
          logger.info('SEND_REMINDER: Mock notification sent', { recoveryCaseId });
          await RecoveryAttempt.findByIdAndUpdate(attempt._id, {
            status: 'SUCCESS',
            result: { channel: 'email', notified: true, isSimulated: true },
          });
          result = { notified: true, isSimulated: true };
          success = true;
          break;
        }

        case RECOVERY_ACTION.ESCALATE_TO_HUMAN: {
          await RecoveryCase.findByIdAndUpdate(recoveryCaseId, {
            status: RECOVERY_CASE_STATUS.ESCALATED,
            currentStage: 'ESCALATED_TO_HUMAN',
          });
          await RecoveryAttempt.findByIdAndUpdate(attempt._id, {
            status: 'SUCCESS',
            result: { escalated: true },
          });
          result = { escalated: true };
          success = true;
          break;
        }

        case RECOVERY_ACTION.STOP: {
          await RecoveryCase.findByIdAndUpdate(recoveryCaseId, {
            status: RECOVERY_CASE_STATUS.STOPPED,
            currentStage: 'STOPPED',
          });
          await RecoveryAttempt.findByIdAndUpdate(attempt._id, {
            status: 'CANCELLED',
            result: { stopped: true },
          });
          result = { stopped: true };
          success = true;
          break;
        }

        default: {
          logger.warn(`Unknown recovery action: ${action}`);
          await RecoveryAttempt.findByIdAndUpdate(attempt._id, {
            status: 'FAILED',
            failureReason: `Unknown action: ${action}`,
          });
          break;
        }
      }

      // Update recovery case attempt count and status
      if (success && action !== RECOVERY_ACTION.STOP) {
        await RecoveryCase.findByIdAndUpdate(recoveryCaseId, {
          $inc: { attemptCount: 1 },
          status: RECOVERY_CASE_STATUS.IN_RECOVERY,
          currentStage: `${action}_EXECUTED`,
          selectedAction: action,
        });
      }

      await auditService.log({
        merchantId: recoveryCase.merchantId.toString(),
        actorType: ACTOR_TYPE.SYSTEM,
        action: `RECOVERY_ACTION_${success ? 'EXECUTED' : 'FAILED'}`,
        entityType: 'RecoveryCase',
        entityId: recoveryCaseId,
        after: { action, result, success },
      });

      await invalidateDashboardCache(recoveryCase.merchantId.toString());

    } catch (error) {
      logger.error('Recovery action execution failed', { action, recoveryCaseId, error });

      await RecoveryAttempt.findByIdAndUpdate(attempt._id, {
        status: 'FAILED',
        failureReason: (error as Error).message,
      });

      await auditService.log({
        merchantId: recoveryCase.merchantId.toString(),
        actorType: ACTOR_TYPE.SYSTEM,
        action: 'RECOVERY_ACTION_FAILED',
        entityType: 'RecoveryCase',
        entityId: recoveryCaseId,
        after: { action, error: (error as Error).message },
      });
    }

    return { success, result };
  },

  /**
   * Mark a payment as recovered (called when payment_link.paid webhook arrives)
   */
  async markRecovered(recoveryCaseId: string, amount: number): Promise<void> {
    const recoveryCase = await RecoveryCase.findByIdAndUpdate(recoveryCaseId, {
      status: RECOVERY_CASE_STATUS.RECOVERED,
      currentStage: 'PAYMENT_RECOVERED',
      recoveredAmount: amount,
    });

    if (recoveryCase?.merchantId) {
      await invalidateDashboardCache(recoveryCase.merchantId.toString());
    }

    await auditService.log({
      merchantId: recoveryCase?.merchantId?.toString() || '',
      actorType: ACTOR_TYPE.RAZORPAY,
      action: 'PAYMENT_RECOVERED',
      entityType: 'RecoveryCase',
      entityId: recoveryCaseId,
      after: { recoveredAmount: amount },
    });
  },

  /**
   * Get paginated recovery cases for a merchant
   */
  async getCases(
    merchantId: string,
    page = 1,
    limit = 20,
    filters?: { status?: string; priority?: string }
  ) {
    const query: Record<string, unknown> = { merchantId };
    if (filters?.status) query.status = filters.status;
    if (filters?.priority) query.priority = filters.priority;

    const [cases, total] = await Promise.all([
      RecoveryCase.find(query)
        .populate('paymentId', 'amount method failureType failureReason')
        .populate('customerId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      RecoveryCase.countDocuments(query),
    ]);

    return { cases, total, page, limit, totalPages: Math.ceil(total / limit) };
  },
};
