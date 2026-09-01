import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, errors } from '../utils/apiResponse';
import {
  validateRazorpayWebhookSignature,
  storeWebhookEvent,
  markWebhookProcessed,
} from '../integrations/razorpay/webhookService';
import { enqueueWebhookJob } from '../queues/queues';
import { recoveryService } from '../services/recovery.service';
import { Payment } from '../models/Payment';
import { RecoveryCase } from '../models/RecoveryCase';
import { WebhookEvent } from '../models/WebhookEvent';
import { auditService } from '../audit/auditService';
import { ACTOR_TYPE, PAYMENT_STATUS } from '../config/constants';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { cache } from '../config/redis';

/**
 * Webhook receiver — must respond quickly.
 * Validates signature, stores event, enqueues for async processing.
 */
export const receiveWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = JSON.stringify(req.body);

  const secret = env.RAZORPAY_WEBHOOK_SECRET || 'recoverai_test_secret';

  // Validate signature if header is provided or secret is present
  if (signature) {
    const isValid = validateRazorpayWebhookSignature(
      rawBody,
      signature,
      secret
    );
    if (!isValid) {
      logger.warn('Webhook: Invalid signature received');
      res.status(401).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } });
      return;
    }
  }

  const event = req.body;
  if (!event || typeof event !== 'object' || Object.keys(event).length === 0) {
    res.status(400).json({ success: false, error: { code: 'MALFORMED_PAYLOAD', message: 'Missing or malformed event payload' } });
    return;
  }

  const eventType = event.event;
  if (!eventType || typeof eventType !== 'string') {
    res.status(400).json({ success: false, error: { code: 'MALFORMED_PAYLOAD', message: 'Missing or invalid event type' } });
    return;
  }

  const eventId = event.id || event.event + '_' + Date.now() + '_' + uuidv4().slice(0, 8);

  // Store event (idempotency check happens inside)
  const storedId = await storeWebhookEvent({
    eventId,
    eventType,
    payload: event,
    signature,
  });

  if (!storedId) {
    // Already processed
    res.status(200).json({ received: true, duplicate: true });
    return;
  }

  // Enqueue for async processing — respond immediately
  await enqueueWebhookJob({ eventId, eventType });

  logger.info(`Webhook received: ${eventType} (${eventId})`);

  // Respond quickly to Razorpay
  res.status(200).json({ received: true });
});

/**
 * Process webhook event — called by worker or directly for simulation
 */
export async function processWebhookEvent(eventId: string, eventType: string): Promise<void> {
  const event = await WebhookEvent.findOne({ eventId });
  if (!event || event.processed) return;

  try {
    const payload = event.payload;
    const paymentEntity = (payload.payload as any)?.payment?.entity;
    const linkEntity = (payload.payload as any)?.payment_link?.entity;

    switch (eventType) {
      case 'payment.failed': {
        if (!paymentEntity) break;

        // Find or create payment record
        let payment = await Payment.findOne({ razorpayPaymentId: paymentEntity.id });
        if (!payment) {
          payment = await Payment.create({
            razorpayPaymentId: paymentEntity.id,
            razorpayOrderId: paymentEntity.order_id,
            amount: paymentEntity.amount,
            currency: paymentEntity.currency || 'INR',
            status: PAYMENT_STATUS.FAILED,
            method: paymentEntity.method,
            failureReason: paymentEntity.error_description,
            failureCode: paymentEntity.error_code,
            failedAt: new Date(),
          });
        }

        // Create recovery case
        if (payment.merchantId) {
          await recoveryService.createRecoveryCase(
            (payment._id as any).toString(),
            payment.merchantId.toString()
          );
        }

        await auditService.log({
          merchantId: payment.merchantId?.toString() || 'unknown',
          actorType: ACTOR_TYPE.RAZORPAY,
          action: 'payment.failed',
          entityType: 'Payment',
          entityId: (payment._id as any).toString(),
          metadata: { amount: paymentEntity.amount, method: paymentEntity.method },
        });

        if (payment.merchantId) {
          await cache.delPattern(`recoverai:dashboard:${payment.merchantId.toString()}:*`);
        }
        break;
      }

      case 'payment.captured': {
        if (!paymentEntity) break;

        await Payment.findOneAndUpdate(
          { razorpayPaymentId: paymentEntity.id },
          { status: PAYMENT_STATUS.CAPTURED, capturedAt: new Date() }
        );

        // Check if there's an open recovery case to close
        const payment = await Payment.findOne({ razorpayPaymentId: paymentEntity.id });
        if (payment) {
          const recoveryCase = await RecoveryCase.findOne({ paymentId: payment._id });
          if (recoveryCase) {
            await recoveryService.markRecovered(
              (recoveryCase._id as any).toString(),
              paymentEntity.amount
            );
          }

          if (payment.merchantId) {
            await cache.delPattern(`recoverai:dashboard:${payment.merchantId.toString()}:*`);
          }
        }
        break;
      }

      case 'payment_link.paid': {
        if (!linkEntity) break;

        // Find recovery case by reference_id
        const referenceId = linkEntity.reference_id;
        if (referenceId?.startsWith('recovery-')) {
          const caseId = referenceId.replace('recovery-', '');
          await recoveryService.markRecovered(caseId, linkEntity.amount);

          await auditService.log({
            merchantId: 'unknown',
            actorType: ACTOR_TYPE.RAZORPAY,
            action: 'payment_link.paid',
            entityType: 'RecoveryCase',
            entityId: caseId,
            after: { recoveredAmount: linkEntity.amount },
          });
        }
        break;
      }

      default:
        logger.info(`Webhook: Unhandled event type: ${eventType}`);
    }

    await markWebhookProcessed(eventId);
  } catch (error) {
    await markWebhookProcessed(eventId, (error as Error).message);
    throw error; // Allow BullMQ to retry
  }
}

export const getWebhookEvents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  const [events, total] = await Promise.all([
    WebhookEvent.find()
      .sort({ receivedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    WebhookEvent.countDocuments(),
  ]);

  sendSuccess(res, events, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});
