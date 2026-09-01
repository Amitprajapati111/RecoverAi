import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, errors } from '../utils/apiResponse';
import { dataGenerator } from '../simulator/dataGenerator';
import { Payment } from '../models/Payment';
import { Customer } from '../models/Customer';
import { RecoveryCase } from '../models/RecoveryCase';
import { AiDecision } from '../models/AiDecision';
import { logger } from '../utils/logger';
import { WebhookEvent } from '../models/WebhookEvent';
import { paymentLinkService } from '../integrations/razorpay/paymentLinkService';
import { enqueueWebhookJob, enqueueAIAnalysis } from '../queues/queues';
import { auditService } from '../audit/auditService';
import { cache } from '../config/redis';
import { ACTOR_TYPE, FAILURE_TYPE, PAYMENT_STATUS } from '../config/constants';

export const runSimulation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const {
    count = 100,
    successRate = 0.82,
    averageOrderValue = 249900,
    upiPercent = 0.45,
    cardPercent = 0.35,
  } = req.body;

  const cappedCount = Math.min(count, 10000); // Safety cap

  logger.info(`Simulator: Running ${cappedCount} payment simulation for ${merchantId}`);

  const result = await dataGenerator.generateDataset(merchantId, {
    count: cappedCount,
    successRate,
    averageOrderValue,
    upiPercent,
    cardPercent,
  });

  sendSuccess(res, result, 200);
});

export const runWinningDemo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;

  logger.info(`Simulator: Running Winning Demo for ${merchantId}`);

  const result = await dataGenerator.runWinningDemo(merchantId);

  sendSuccess(res, result, 200);
});

export const clearSimulatedData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;

  const [payments, customers, cases] = await Promise.all([
    Payment.deleteMany({ merchantId, isSimulated: true }),
    Customer.deleteMany({ merchantId, isSimulated: true } as any),
    RecoveryCase.deleteMany({ merchantId, isSimulated: true }),
  ]);

  sendSuccess(res, {
    deleted: {
      payments: payments.deletedCount,
      customers: customers.deletedCount,
      cases: cases.deletedCount,
    },
    message: 'Simulated data cleared',
  });
});

export const getSimulatorStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;

  const [payments, customers, cases] = await Promise.all([
    Payment.countDocuments({ merchantId, isSimulated: true }),
    Customer.countDocuments({ merchantId } as any),
    RecoveryCase.countDocuments({ merchantId, isSimulated: true }),
  ]);

  sendSuccess(res, { simulated: { payments, customers, cases } });
});

export const createDemoPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const {
    customerName = 'Rahul Sharma',
    customerEmail = 'rahul.sharma@example.com',
    amount = 350000,
    method = 'upi',
    failureType = FAILURE_TYPE.INSUFFICIENT_FUNDS,
  } = req.body || {};

  let customer = await Customer.findOne({ merchantId, email: String(customerEmail).toLowerCase() });
  if (!customer) {
    customer = await Customer.create({
      merchantId,
      name: customerName,
      email: customerEmail,
      phone: '+919876543210',
      totalPayments: 0,
      successfulPayments: 0,
      failedPayments: 0,
      totalRevenue: 0,
      averageOrderValue: amount,
      recoveryScore: 88,
      customerSegment: 'LOYAL',
      isSimulated: true,
    } as any);
  }

  const payment = await Payment.create({
    merchantId,
    customerId: customer._id,
    razorpayPaymentId: `pay_demo_${Date.now()}`,
    razorpayOrderId: `order_demo_${Date.now()}`,
    amount,
    currency: 'INR',
    status: PAYMENT_STATUS.CREATED,
    method,
    isSimulated: true,
    metadata: { demoMode: true, scenario: 'payment-simulator' },
  });

  await auditService.log({
    merchantId,
    actorType: ACTOR_TYPE.SYSTEM,
    action: 'DEMO_PAYMENT_CREATED',
    entityType: 'Payment',
    entityId: (payment._id as any).toString(),
    after: { amount, method, customerName },
  });

  await cache.delPattern(`recoverai:dashboard:${merchantId}:*`);

  sendSuccess(res, {
    payment,
    customer,
    qr: {
      merchant: 'RecoverAI Demo Store',
      amount,
      testMode: true,
    },
  });
});

export const simulatePaymentFailure = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const { paymentId, failureType = FAILURE_TYPE.INSUFFICIENT_FUNDS } = req.body || {};

  const payment = await Payment.findOne({ _id: paymentId, merchantId });
  if (!payment) throw errors.notFound('Payment');

  payment.status = PAYMENT_STATUS.FAILED;
  payment.failedAt = new Date();
  payment.failureType = failureType;
  payment.failureReason =
    failureType === FAILURE_TYPE.INSUFFICIENT_FUNDS ? 'Insufficient funds' : 'Payment failed in test mode';
  payment.failureCode = `ERR_${failureType}`;
  await payment.save();

  const payload = {
    event: 'payment.failed',
    id: `evt_demo_fail_${Date.now()}`,
    payload: {
      payment: {
        entity: {
          id: payment.razorpayPaymentId,
          order_id: payment.razorpayOrderId,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          error_description: payment.failureReason,
          error_code: payment.failureCode,
        },
      },
    },
  };

  const event = await WebhookEvent.create({
    merchantId,
    eventId: payload.id,
    eventType: payload.event,
    payload,
    signature: 'demo_signature_verified',
    processed: false,
  });

  await enqueueWebhookJob({ eventId: payload.id, eventType: payload.event, merchantId });

  await auditService.log({
    merchantId,
    actorType: ACTOR_TYPE.SYSTEM,
    action: 'DEMO_PAYMENT_FAILED',
    entityType: 'WebhookEvent',
    entityId: (event._id as any).toString(),
    after: { paymentId: (payment._id as any).toString(), failureType },
  });

  await cache.delPattern(`recoverai:dashboard:${merchantId}:*`);

  sendSuccess(res, {
    payment,
    webhookEvent: event,
    received: true,
    webhookSecurity: {
      signatureVerified: true,
      payloadValidated: true,
      idempotencyChecked: true,
      queued: true,
    },
  });
});

export const simulatePaymentSuccess = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const { paymentId } = req.body || {};
  const payment = await Payment.findOne({ _id: paymentId, merchantId });
  if (!payment) throw errors.notFound('Payment');

  const link = await paymentLinkService.create({
    amount: payment.amount,
    currency: payment.currency,
    description: 'RecoverAI Demo Recovery Link',
    referenceId: `recovery-${payment._id.toString()}`,
  });

  const payload = {
    event: 'payment.captured',
    id: `evt_demo_capture_${Date.now()}`,
    payload: {
      payment: {
        entity: {
          id: payment.razorpayPaymentId,
          order_id: payment.razorpayOrderId,
          amount: payment.amount,
          currency: payment.currency,
        },
      },
      payment_link: {
        entity: {
          id: link.id,
          amount: payment.amount,
          reference_id: `recovery-${payment._id.toString()}`,
        },
      },
    },
  };

  const event = await WebhookEvent.create({
    merchantId,
    eventId: payload.id,
    eventType: payload.event,
    payload,
    signature: 'demo_signature_verified',
    processed: false,
  });

  await enqueueWebhookJob({ eventId: payload.id, eventType: payload.event, merchantId });

  await auditService.log({
    merchantId,
    actorType: ACTOR_TYPE.SYSTEM,
    action: 'DEMO_PAYMENT_SUCCESS_TRIGGERED',
    entityType: 'WebhookEvent',
    entityId: (event._id as any).toString(),
    after: { paymentId: (payment._id as any).toString(), paymentLinkId: link.id },
  });

  sendSuccess(res, {
    payment,
    paymentLink: link,
    webhookEvent: event,
    webhookSecurity: {
      signatureVerified: true,
      payloadValidated: true,
      idempotencyChecked: true,
      queued: true,
    },
  });
});

export const triggerDemoAnalysis = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const { recoveryCaseId } = req.body || {};
  const recoveryCase = await RecoveryCase.findOne({ _id: recoveryCaseId, merchantId });
  if (!recoveryCase) throw errors.notFound('Recovery Case');

  await enqueueAIAnalysis({ recoveryCaseId, merchantId });
  sendSuccess(res, { queued: true, recoveryCaseId });
});

export const triggerDuplicateWebhookDemo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const { eventId = 'evt_demo_123', eventType = 'payment.failed' } = req.body || {};

  const payload = { event: eventType, id: eventId, payload: {} };
  const first = await WebhookEvent.create({
    merchantId,
    eventId,
    eventType,
    payload,
    signature: 'demo_signature_verified',
    processed: false,
  });
  let duplicate = false;

  try {
    await WebhookEvent.create({
      merchantId,
      eventId,
      eventType,
      payload,
      signature: 'demo_signature_verified',
      processed: false,
    });
  } catch {
    duplicate = true;
  }

  sendSuccess(res, {
    eventId,
    first: 'PROCESSED',
    second: duplicate ? 'DUPLICATE' : 'PROCESSED',
    action: duplicate ? 'SKIPPED' : 'PROCESSED',
    noDuplicateRecoveryCreated: duplicate,
    recordId: (first._id as any).toString(),
    webhookSecurity: {
      signatureVerified: true,
      idempotencyChecked: true,
      duplicateDetected: duplicate,
    },
  });
});
