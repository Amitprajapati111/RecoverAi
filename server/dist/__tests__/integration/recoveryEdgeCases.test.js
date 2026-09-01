"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const PolicyEngine_1 = require("../../policies/PolicyEngine");
const recovery_service_1 = require("../../services/recovery.service");
const Payment_1 = require("../../models/Payment");
const RecoveryCase_1 = require("../../models/RecoveryCase");
const constants_1 = require("../../config/constants");
const env_1 = require("../../config/env");
describe('Recovery Edge Cases Test Suite', () => {
    let merchantId;
    let defaultPolicy;
    beforeAll(async () => {
        if (mongoose_1.default.connection.readyState === 0) {
            await mongoose_1.default.connect(env_1.env.MONGODB_URI);
        }
        merchantId = new mongoose_1.default.Types.ObjectId();
        defaultPolicy = {
            merchantId,
            maxAttempts: 3,
            maxAmountPerAction: 5000000,
            minimumRecoveryProbability: 0.55,
            cooldownMinutes: 30,
            allowedActions: [
                constants_1.RECOVERY_ACTION.CREATE_PAYMENT_LINK,
                constants_1.RECOVERY_ACTION.SEND_REMINDER,
                constants_1.RECOVERY_ACTION.ESCALATE_TO_HUMAN,
                constants_1.RECOVERY_ACTION.STOP,
            ],
            allowedChannels: ['email', 'sms', 'whatsapp'],
            requireApprovalAboveAmount: 500000, // ₹5,000 in paise
            stopAfterSuccessfulPayment: true,
            stopAfterMaxAttempts: true,
            isActive: true,
        };
    });
    afterAll(async () => {
        await mongoose_1.default.disconnect();
    });
    // Edge Case 1: Low Recovery Probability -> Policy BLOCKED
    describe('Edge Case 1: Low Probability → Policy BLOCKED', () => {
        it('should block recovery execution when AI recovery probability is below minimum policy threshold', () => {
            const mockCase = {
                _id: new mongoose_1.default.Types.ObjectId(),
                attemptCount: 0,
                amountAtRisk: 100000,
            };
            const mockCustomer = {
                optedOutOfRecovery: false,
            };
            const lowProbDecision = {
                recommendedAction: constants_1.RECOVERY_ACTION.CREATE_PAYMENT_LINK,
                recoveryProbability: 0.35, // 35% < 55% threshold
                requiresHumanApproval: false,
            };
            const result = PolicyEngine_1.policyEngine.evaluate(lowProbDecision, mockCase, mockCustomer, defaultPolicy);
            expect(result.approved).toBe(false);
            expect(result.requiresHumanApproval).toBe(false);
            expect(result.action).toBe('STOP');
            expect(result.blockedReason).toContain('below minimum threshold');
        });
    });
    // Edge Case 2: High Transaction Amount -> Escalates for HUMAN APPROVAL
    describe('Edge Case 2: High Amount → HUMAN APPROVAL', () => {
        it('should require human approval when transaction amount exceeds policy approval threshold', () => {
            const highAmountCase = {
                _id: new mongoose_1.default.Types.ObjectId(),
                attemptCount: 0,
                amountAtRisk: 1500000, // ₹15,000 > ₹5,000 threshold
            };
            const mockCustomer = {
                optedOutOfRecovery: false,
            };
            const highProbDecision = {
                recommendedAction: constants_1.RECOVERY_ACTION.CREATE_PAYMENT_LINK,
                recoveryProbability: 0.9,
                requiresHumanApproval: false,
            };
            const result = PolicyEngine_1.policyEngine.evaluate(highProbDecision, highAmountCase, mockCustomer, defaultPolicy);
            expect(result.approved).toBe(false); // Held pending human review
            expect(result.requiresHumanApproval).toBe(true);
            expect(result.action).toBe(constants_1.RECOVERY_ACTION.CREATE_PAYMENT_LINK);
        });
    });
    // Edge Case 3: Max Attempts Exceeded -> Policy EXHAUSTED / BLOCKED
    describe('Edge Case 3: Max Attempts → EXHAUSTED', () => {
        it('should block further recovery attempts once attempt count reaches maxAttempts limit', () => {
            const exhaustedCase = {
                _id: new mongoose_1.default.Types.ObjectId(),
                attemptCount: 3, // 3 >= maxAttempts (3)
                amountAtRisk: 100000,
            };
            const mockCustomer = {
                optedOutOfRecovery: false,
            };
            const validDecision = {
                recommendedAction: constants_1.RECOVERY_ACTION.CREATE_PAYMENT_LINK,
                recoveryProbability: 0.85,
                requiresHumanApproval: false,
            };
            const result = PolicyEngine_1.policyEngine.evaluate(validDecision, exhaustedCase, mockCustomer, defaultPolicy);
            expect(result.approved).toBe(false);
            expect(result.action).toBe('STOP');
            expect(result.blockedReason).toContain('Maximum recovery attempts');
        });
    });
    // Edge Case 4: Payment Captured / Link Paid -> Case RECOVERED
    describe('Edge Case 4: Payment Success → RECOVERED', () => {
        it('should transition recovery case to RECOVERED and log recoveredAmount on successful payment', async () => {
            const payment = await Payment_1.Payment.create({
                merchantId,
                amount: 350000,
                currency: 'INR',
                status: constants_1.PAYMENT_STATUS.FAILED,
                isSimulated: true,
            });
            const recoveryCase = await RecoveryCase_1.RecoveryCase.create({
                merchantId,
                paymentId: payment._id,
                amountAtRisk: payment.amount,
                status: constants_1.RECOVERY_CASE_STATUS.IN_RECOVERY,
                currentStage: 'PAYMENT_LINK_CREATED',
                isSimulated: true,
            });
            const caseId = recoveryCase._id.toString();
            // Trigger markRecovered (same as webhook payment_link.paid / payment.captured)
            await recovery_service_1.recoveryService.markRecovered(caseId, payment.amount);
            const updatedCase = await RecoveryCase_1.RecoveryCase.findById(caseId);
            expect(updatedCase).not.toBeNull();
            expect(updatedCase?.status).toBe(constants_1.RECOVERY_CASE_STATUS.RECOVERED);
            expect(updatedCase?.currentStage).toBe('PAYMENT_RECOVERED');
            expect(updatedCase?.recoveredAmount).toBe(350000);
        });
    });
});
//# sourceMappingURL=recoveryEdgeCases.test.js.map