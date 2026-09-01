import mongoose from 'mongoose';
import { recoveryService } from '../../services/recovery.service';
import { storeWebhookEvent } from '../../integrations/razorpay/webhookService';
import { Payment } from '../../models/Payment';
import { Customer } from '../../models/Customer';
import { RecoveryCase } from '../../models/RecoveryCase';
import { RecoveryAttempt } from '../../models/RecoveryAttempt';
import { WebhookEvent } from '../../models/WebhookEvent';
import { PAYMENT_STATUS, RECOVERY_ACTION, RECOVERY_CASE_STATUS } from '../../config/constants';
import { env } from '../../config/env';

describe('Idempotency Test Suite', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Webhook Idempotency', () => {
    it('should process first webhook event and reject duplicate deliveries', async () => {
      const uniqueEventId = `evt_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // First attempt -> Successfully stored
      const firstStoredId = await storeWebhookEvent({
        eventId: uniqueEventId,
        eventType: 'payment.failed',
        payload: { id: uniqueEventId, amount: 150000 },
      });

      expect(firstStoredId).toBeDefined();
      expect(typeof firstStoredId).toBe('string');

      // Second attempt (duplicate delivery) -> Returns null (detected as duplicate)
      const secondStoredId = await storeWebhookEvent({
        eventId: uniqueEventId,
        eventType: 'payment.failed',
        payload: { id: uniqueEventId, amount: 150000 },
      });

      expect(secondStoredId).toBeNull();

      // Third attempt (duplicate delivery) -> Returns null
      const thirdStoredId = await storeWebhookEvent({
        eventId: uniqueEventId,
        eventType: 'payment.failed',
        payload: { id: uniqueEventId, amount: 150000 },
      });

      expect(thirdStoredId).toBeNull();

      // Verify exact count in database is 1
      const count = await WebhookEvent.countDocuments({ eventId: uniqueEventId });
      expect(count).toBe(1);
    });
  });

  describe('Recovery Action Idempotency', () => {
    it('should execute recovery action once and return duplicate: true on redundant invocations', async () => {
      const merchantId = new mongoose.Types.ObjectId();

      const customer = await Customer.create({
        merchantId,
        name: 'Idempotency Tester',
        email: 'idempotency@test.com',
        phone: '+919876543210',
      });

      const payment = await Payment.create({
        merchantId,
        customerId: customer._id,
        amount: 299900,
        currency: 'INR',
        status: PAYMENT_STATUS.FAILED,
        isSimulated: true,
      });

      const recoveryCase = await RecoveryCase.create({
        merchantId,
        paymentId: payment._id,
        customerId: customer._id,
        amountAtRisk: payment.amount,
        status: RECOVERY_CASE_STATUS.RECOVERABLE,
        attemptCount: 0,
        isSimulated: true,
      });

      const caseId = (recoveryCase._id as mongoose.Types.ObjectId).toString();

      // Call 1: Execute recovery action (CREATE_PAYMENT_LINK)
      const exec1 = await recoveryService.executeAction(
        caseId,
        RECOVERY_ACTION.CREATE_PAYMENT_LINK,
        0
      );

      expect(exec1.success).toBe(true);
      expect(exec1.result.paymentLinkId).toBeDefined();

      // Call 2: Redundant execution with same case state
      const exec2 = await recoveryService.executeAction(
        caseId,
        RECOVERY_ACTION.CREATE_PAYMENT_LINK,
        0
      );

      expect(exec2.success).toBe(true);
      expect(exec2.result.duplicate).toBe(true);

      // Call 3: Redundant execution
      const exec3 = await recoveryService.executeAction(
        caseId,
        RECOVERY_ACTION.CREATE_PAYMENT_LINK,
        0
      );

      expect(exec3.success).toBe(true);
      expect(exec3.result.duplicate).toBe(true);

      // Verify exact count of RecoveryAttempt records is 1
      const attemptsCount = await RecoveryAttempt.countDocuments({ recoveryCaseId: recoveryCase._id });
      expect(attemptsCount).toBe(1);
    });
  });
});
