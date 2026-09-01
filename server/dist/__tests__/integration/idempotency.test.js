"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const recovery_service_1 = require("../../services/recovery.service");
const webhookService_1 = require("../../integrations/razorpay/webhookService");
const Payment_1 = require("../../models/Payment");
const Customer_1 = require("../../models/Customer");
const RecoveryCase_1 = require("../../models/RecoveryCase");
const RecoveryAttempt_1 = require("../../models/RecoveryAttempt");
const WebhookEvent_1 = require("../../models/WebhookEvent");
const constants_1 = require("../../config/constants");
const env_1 = require("../../config/env");
describe('Idempotency Test Suite', () => {
    beforeAll(async () => {
        if (mongoose_1.default.connection.readyState === 0) {
            await mongoose_1.default.connect(env_1.env.MONGODB_URI);
        }
    });
    afterAll(async () => {
        await mongoose_1.default.disconnect();
    });
    describe('Webhook Idempotency', () => {
        it('should process first webhook event and reject duplicate deliveries', async () => {
            const uniqueEventId = `evt_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            // First attempt -> Successfully stored
            const firstStoredId = await (0, webhookService_1.storeWebhookEvent)({
                eventId: uniqueEventId,
                eventType: 'payment.failed',
                payload: { id: uniqueEventId, amount: 150000 },
            });
            expect(firstStoredId).toBeDefined();
            expect(typeof firstStoredId).toBe('string');
            // Second attempt (duplicate delivery) -> Returns null (detected as duplicate)
            const secondStoredId = await (0, webhookService_1.storeWebhookEvent)({
                eventId: uniqueEventId,
                eventType: 'payment.failed',
                payload: { id: uniqueEventId, amount: 150000 },
            });
            expect(secondStoredId).toBeNull();
            // Third attempt (duplicate delivery) -> Returns null
            const thirdStoredId = await (0, webhookService_1.storeWebhookEvent)({
                eventId: uniqueEventId,
                eventType: 'payment.failed',
                payload: { id: uniqueEventId, amount: 150000 },
            });
            expect(thirdStoredId).toBeNull();
            // Verify exact count in database is 1
            const count = await WebhookEvent_1.WebhookEvent.countDocuments({ eventId: uniqueEventId });
            expect(count).toBe(1);
        });
    });
    describe('Recovery Action Idempotency', () => {
        it('should execute recovery action once and return duplicate: true on redundant invocations', async () => {
            const merchantId = new mongoose_1.default.Types.ObjectId();
            const customer = await Customer_1.Customer.create({
                merchantId,
                name: 'Idempotency Tester',
                email: 'idempotency@test.com',
                phone: '+919876543210',
            });
            const payment = await Payment_1.Payment.create({
                merchantId,
                customerId: customer._id,
                amount: 299900,
                currency: 'INR',
                status: constants_1.PAYMENT_STATUS.FAILED,
                isSimulated: true,
            });
            const recoveryCase = await RecoveryCase_1.RecoveryCase.create({
                merchantId,
                paymentId: payment._id,
                customerId: customer._id,
                amountAtRisk: payment.amount,
                status: constants_1.RECOVERY_CASE_STATUS.RECOVERABLE,
                attemptCount: 0,
                isSimulated: true,
            });
            const caseId = recoveryCase._id.toString();
            // Call 1: Execute recovery action (CREATE_PAYMENT_LINK)
            const exec1 = await recovery_service_1.recoveryService.executeAction(caseId, constants_1.RECOVERY_ACTION.CREATE_PAYMENT_LINK, 0);
            expect(exec1.success).toBe(true);
            expect(exec1.result.paymentLinkId).toBeDefined();
            // Call 2: Redundant execution with same case state
            const exec2 = await recovery_service_1.recoveryService.executeAction(caseId, constants_1.RECOVERY_ACTION.CREATE_PAYMENT_LINK, 0);
            expect(exec2.success).toBe(true);
            expect(exec2.result.duplicate).toBe(true);
            // Call 3: Redundant execution
            const exec3 = await recovery_service_1.recoveryService.executeAction(caseId, constants_1.RECOVERY_ACTION.CREATE_PAYMENT_LINK, 0);
            expect(exec3.success).toBe(true);
            expect(exec3.result.duplicate).toBe(true);
            // Verify exact count of RecoveryAttempt records is 1
            const attemptsCount = await RecoveryAttempt_1.RecoveryAttempt.countDocuments({ recoveryCaseId: recoveryCase._id });
            expect(attemptsCount).toBe(1);
        });
    });
});
//# sourceMappingURL=idempotency.test.js.map