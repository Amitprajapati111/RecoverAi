import mongoose from 'mongoose';
import { policyEngine } from '../../policies/PolicyEngine';
import { recoveryService } from '../../services/recovery.service';
import { processWebhookEvent } from '../../controllers/webhook.controller';
import { storeWebhookEvent } from '../../integrations/razorpay/webhookService';
import { Payment } from '../../models/Payment';
import { Customer } from '../../models/Customer';
import { RecoveryCase } from '../../models/RecoveryCase';
import { RecoveryPolicy } from '../../models/RecoveryPolicy';
import {
  PAYMENT_STATUS,
  RECOVERY_CASE_STATUS,
  RECOVERY_ACTION,
  DEFAULT_POLICY,
} from '../../config/constants';
import { env } from '../../config/env';

describe('Recovery Edge Cases Test Suite', () => {
  let merchantId: mongoose.Types.ObjectId;
  let defaultPolicy: any;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
    merchantId = new mongoose.Types.ObjectId();

    defaultPolicy = {
      merchantId,
      maxAttempts: 3,
      maxAmountPerAction: 5000000,
      minimumRecoveryProbability: 0.55,
      cooldownMinutes: 30,
      allowedActions: [
        RECOVERY_ACTION.CREATE_PAYMENT_LINK,
        RECOVERY_ACTION.SEND_REMINDER,
        RECOVERY_ACTION.ESCALATE_TO_HUMAN,
        RECOVERY_ACTION.STOP,
      ],
      allowedChannels: ['email', 'sms', 'whatsapp'],
      requireApprovalAboveAmount: 500000, // ₹5,000 in paise
      stopAfterSuccessfulPayment: true,
      stopAfterMaxAttempts: true,
      isActive: true,
    };
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // Edge Case 1: Low Recovery Probability -> Policy BLOCKED
  describe('Edge Case 1: Low Probability → Policy BLOCKED', () => {
    it('should block recovery execution when AI recovery probability is below minimum policy threshold', () => {
      const mockCase: any = {
        _id: new mongoose.Types.ObjectId(),
        attemptCount: 0,
        amountAtRisk: 100000,
      };

      const mockCustomer: any = {
        optedOutOfRecovery: false,
      };

      const lowProbDecision: any = {
        recommendedAction: RECOVERY_ACTION.CREATE_PAYMENT_LINK,
        recoveryProbability: 0.35, // 35% < 55% threshold
        requiresHumanApproval: false,
      };

      const result = policyEngine.evaluate(
        lowProbDecision,
        mockCase,
        mockCustomer,
        defaultPolicy
      );

      expect(result.approved).toBe(false);
      expect(result.requiresHumanApproval).toBe(false);
      expect(result.action).toBe('STOP');
      expect(result.blockedReason).toContain('below minimum threshold');
    });
  });

  // Edge Case 2: High Transaction Amount -> Escalates for HUMAN APPROVAL
  describe('Edge Case 2: High Amount → HUMAN APPROVAL', () => {
    it('should require human approval when transaction amount exceeds policy approval threshold', () => {
      const highAmountCase: any = {
        _id: new mongoose.Types.ObjectId(),
        attemptCount: 0,
        amountAtRisk: 1500000, // ₹15,000 > ₹5,000 threshold
      };

      const mockCustomer: any = {
        optedOutOfRecovery: false,
      };

      const highProbDecision: any = {
        recommendedAction: RECOVERY_ACTION.CREATE_PAYMENT_LINK,
        recoveryProbability: 0.9,
        requiresHumanApproval: false,
      };

      const result = policyEngine.evaluate(
        highProbDecision,
        highAmountCase,
        mockCustomer,
        defaultPolicy
      );

      expect(result.approved).toBe(false); // Held pending human review
      expect(result.requiresHumanApproval).toBe(true);
      expect(result.action).toBe(RECOVERY_ACTION.CREATE_PAYMENT_LINK);
    });
  });

  // Edge Case 3: Max Attempts Exceeded -> Policy EXHAUSTED / BLOCKED
  describe('Edge Case 3: Max Attempts → EXHAUSTED', () => {
    it('should block further recovery attempts once attempt count reaches maxAttempts limit', () => {
      const exhaustedCase: any = {
        _id: new mongoose.Types.ObjectId(),
        attemptCount: 3, // 3 >= maxAttempts (3)
        amountAtRisk: 100000,
      };

      const mockCustomer: any = {
        optedOutOfRecovery: false,
      };

      const validDecision: any = {
        recommendedAction: RECOVERY_ACTION.CREATE_PAYMENT_LINK,
        recoveryProbability: 0.85,
        requiresHumanApproval: false,
      };

      const result = policyEngine.evaluate(
        validDecision,
        exhaustedCase,
        mockCustomer,
        defaultPolicy
      );

      expect(result.approved).toBe(false);
      expect(result.action).toBe('STOP');
      expect(result.blockedReason).toContain('Maximum recovery attempts');
    });
  });

  // Edge Case 4: Payment Captured / Link Paid -> Case RECOVERED
  describe('Edge Case 4: Payment Success → RECOVERED', () => {
    it('should transition recovery case to RECOVERED and log recoveredAmount on successful payment', async () => {
      const payment = await Payment.create({
        merchantId,
        amount: 350000,
        currency: 'INR',
        status: PAYMENT_STATUS.FAILED,
        isSimulated: true,
      });

      const recoveryCase = await RecoveryCase.create({
        merchantId,
        paymentId: payment._id,
        amountAtRisk: payment.amount,
        status: RECOVERY_CASE_STATUS.IN_RECOVERY,
        currentStage: 'PAYMENT_LINK_CREATED',
        isSimulated: true,
      });

      const caseId = (recoveryCase._id as mongoose.Types.ObjectId).toString();

      // Trigger markRecovered (same as webhook payment_link.paid / payment.captured)
      await recoveryService.markRecovered(caseId, payment.amount);

      const updatedCase = await RecoveryCase.findById(caseId);
      expect(updatedCase).not.toBeNull();
      expect(updatedCase?.status).toBe(RECOVERY_CASE_STATUS.RECOVERED);
      expect(updatedCase?.currentStage).toBe('PAYMENT_RECOVERED');
      expect(updatedCase?.recoveredAmount).toBe(350000);
    });
  });
});
