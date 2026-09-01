"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerDuplicateWebhookDemo = exports.triggerDemoAnalysis = exports.simulatePaymentSuccess = exports.simulatePaymentFailure = exports.createDemoPayment = exports.getSimulatorStats = exports.clearSimulatedData = exports.runWinningDemo = exports.runSimulation = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const dataGenerator_1 = require("../simulator/dataGenerator");
const Payment_1 = require("../models/Payment");
const Customer_1 = require("../models/Customer");
const RecoveryCase_1 = require("../models/RecoveryCase");
const logger_1 = require("../utils/logger");
const WebhookEvent_1 = require("../models/WebhookEvent");
const paymentLinkService_1 = require("../integrations/razorpay/paymentLinkService");
const queues_1 = require("../queues/queues");
const auditService_1 = require("../audit/auditService");
const redis_1 = require("../config/redis");
const constants_1 = require("../config/constants");
exports.runSimulation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const { count = 100, successRate = 0.82, averageOrderValue = 249900, upiPercent = 0.45, cardPercent = 0.35, } = req.body;
    const cappedCount = Math.min(count, 10000); // Safety cap
    logger_1.logger.info(`Simulator: Running ${cappedCount} payment simulation for ${merchantId}`);
    const result = await dataGenerator_1.dataGenerator.generateDataset(merchantId, {
        count: cappedCount,
        successRate,
        averageOrderValue,
        upiPercent,
        cardPercent,
    });
    (0, apiResponse_1.sendSuccess)(res, result, 200);
});
exports.runWinningDemo = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    logger_1.logger.info(`Simulator: Running Winning Demo for ${merchantId}`);
    const result = await dataGenerator_1.dataGenerator.runWinningDemo(merchantId);
    (0, apiResponse_1.sendSuccess)(res, result, 200);
});
exports.clearSimulatedData = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const [payments, customers, cases] = await Promise.all([
        Payment_1.Payment.deleteMany({ merchantId, isSimulated: true }),
        Customer_1.Customer.deleteMany({ merchantId, isSimulated: true }),
        RecoveryCase_1.RecoveryCase.deleteMany({ merchantId, isSimulated: true }),
    ]);
    (0, apiResponse_1.sendSuccess)(res, {
        deleted: {
            payments: payments.deletedCount,
            customers: customers.deletedCount,
            cases: cases.deletedCount,
        },
        message: 'Simulated data cleared',
    });
});
exports.getSimulatorStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const [payments, customers, cases] = await Promise.all([
        Payment_1.Payment.countDocuments({ merchantId, isSimulated: true }),
        Customer_1.Customer.countDocuments({ merchantId }),
        RecoveryCase_1.RecoveryCase.countDocuments({ merchantId, isSimulated: true }),
    ]);
    (0, apiResponse_1.sendSuccess)(res, { simulated: { payments, customers, cases } });
});
exports.createDemoPayment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const { customerName = 'Rahul Sharma', customerEmail = 'rahul.sharma@example.com', amount = 350000, method = 'upi', failureType = constants_1.FAILURE_TYPE.INSUFFICIENT_FUNDS, } = req.body || {};
    let customer = await Customer_1.Customer.findOne({ merchantId, email: String(customerEmail).toLowerCase() });
    if (!customer) {
        customer = await Customer_1.Customer.create({
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
        });
    }
    const payment = await Payment_1.Payment.create({
        merchantId,
        customerId: customer._id,
        razorpayPaymentId: `pay_demo_${Date.now()}`,
        razorpayOrderId: `order_demo_${Date.now()}`,
        amount,
        currency: 'INR',
        status: constants_1.PAYMENT_STATUS.CREATED,
        method,
        isSimulated: true,
        metadata: { demoMode: true, scenario: 'payment-simulator' },
    });
    await auditService_1.auditService.log({
        merchantId,
        actorType: constants_1.ACTOR_TYPE.SYSTEM,
        action: 'DEMO_PAYMENT_CREATED',
        entityType: 'Payment',
        entityId: payment._id.toString(),
        after: { amount, method, customerName },
    });
    await redis_1.cache.delPattern(`recoverai:dashboard:${merchantId}:*`);
    (0, apiResponse_1.sendSuccess)(res, {
        payment,
        customer,
        qr: {
            merchant: 'RecoverAI Demo Store',
            amount,
            testMode: true,
        },
    });
});
exports.simulatePaymentFailure = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const { paymentId, failureType = constants_1.FAILURE_TYPE.INSUFFICIENT_FUNDS } = req.body || {};
    const payment = await Payment_1.Payment.findOne({ _id: paymentId, merchantId });
    if (!payment)
        throw apiResponse_1.errors.notFound('Payment');
    payment.status = constants_1.PAYMENT_STATUS.FAILED;
    payment.failedAt = new Date();
    payment.failureType = failureType;
    payment.failureReason =
        failureType === constants_1.FAILURE_TYPE.INSUFFICIENT_FUNDS ? 'Insufficient funds' : 'Payment failed in test mode';
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
    const event = await WebhookEvent_1.WebhookEvent.create({
        merchantId,
        eventId: payload.id,
        eventType: payload.event,
        payload,
        processed: false,
    });
    await (0, queues_1.enqueueWebhookJob)({ eventId: payload.id, eventType: payload.event, merchantId });
    await auditService_1.auditService.log({
        merchantId,
        actorType: constants_1.ACTOR_TYPE.SYSTEM,
        action: 'DEMO_PAYMENT_FAILED',
        entityType: 'WebhookEvent',
        entityId: event._id.toString(),
        after: { paymentId: payment._id.toString(), failureType },
    });
    await redis_1.cache.delPattern(`recoverai:dashboard:${merchantId}:*`);
    (0, apiResponse_1.sendSuccess)(res, { payment, webhookEvent: event, received: true });
});
exports.simulatePaymentSuccess = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const { paymentId } = req.body || {};
    const payment = await Payment_1.Payment.findOne({ _id: paymentId, merchantId });
    if (!payment)
        throw apiResponse_1.errors.notFound('Payment');
    const link = await paymentLinkService_1.paymentLinkService.create({
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
    const event = await WebhookEvent_1.WebhookEvent.create({
        merchantId,
        eventId: payload.id,
        eventType: payload.event,
        payload,
        processed: false,
    });
    await (0, queues_1.enqueueWebhookJob)({ eventId: payload.id, eventType: payload.event, merchantId });
    await auditService_1.auditService.log({
        merchantId,
        actorType: constants_1.ACTOR_TYPE.SYSTEM,
        action: 'DEMO_PAYMENT_SUCCESS_TRIGGERED',
        entityType: 'WebhookEvent',
        entityId: event._id.toString(),
        after: { paymentId: payment._id.toString(), paymentLinkId: link.id },
    });
    (0, apiResponse_1.sendSuccess)(res, { payment, paymentLink: link, webhookEvent: event });
});
exports.triggerDemoAnalysis = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const { recoveryCaseId } = req.body || {};
    const recoveryCase = await RecoveryCase_1.RecoveryCase.findOne({ _id: recoveryCaseId, merchantId });
    if (!recoveryCase)
        throw apiResponse_1.errors.notFound('Recovery Case');
    await (0, queues_1.enqueueAIAnalysis)({ recoveryCaseId, merchantId });
    (0, apiResponse_1.sendSuccess)(res, { queued: true, recoveryCaseId });
});
exports.triggerDuplicateWebhookDemo = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const { eventId = 'evt_demo_123', eventType = 'payment.failed' } = req.body || {};
    const payload = { event: eventType, id: eventId, payload: {} };
    const first = await WebhookEvent_1.WebhookEvent.create({ merchantId, eventId, eventType, payload, processed: false });
    let duplicate = false;
    try {
        await WebhookEvent_1.WebhookEvent.create({ merchantId, eventId, eventType, payload, processed: false });
    }
    catch {
        duplicate = true;
    }
    (0, apiResponse_1.sendSuccess)(res, {
        eventId,
        first: 'PROCESSED',
        second: duplicate ? 'DUPLICATE' : 'PROCESSED',
        action: duplicate ? 'SKIPPED' : 'PROCESSED',
        noDuplicateRecoveryCreated: duplicate,
        recordId: first._id.toString(),
    });
});
//# sourceMappingURL=simulator.controller.js.map