"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebhookEvents = exports.receiveWebhook = void 0;
exports.processWebhookEvent = processWebhookEvent;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const webhookService_1 = require("../integrations/razorpay/webhookService");
const queues_1 = require("../queues/queues");
const recovery_service_1 = require("../services/recovery.service");
const Payment_1 = require("../models/Payment");
const RecoveryCase_1 = require("../models/RecoveryCase");
const WebhookEvent_1 = require("../models/WebhookEvent");
const auditService_1 = require("../audit/auditService");
const constants_1 = require("../config/constants");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
const redis_1 = require("../config/redis");
/**
 * Webhook receiver — must respond quickly.
 * Validates signature, stores event, enqueues for async processing.
 */
exports.receiveWebhook = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = JSON.stringify(req.body);
    const secret = env_1.env.RAZORPAY_WEBHOOK_SECRET || 'recoverai_test_secret';
    // Validate signature if header is provided or secret is present
    if (signature) {
        const isValid = (0, webhookService_1.validateRazorpayWebhookSignature)(rawBody, signature, secret);
        if (!isValid) {
            logger_1.logger.warn('Webhook: Invalid signature received');
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
    const eventId = event.id || event.event + '_' + Date.now() + '_' + (0, uuid_1.v4)().slice(0, 8);
    // Store event (idempotency check happens inside)
    const storedId = await (0, webhookService_1.storeWebhookEvent)({
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
    await (0, queues_1.enqueueWebhookJob)({ eventId, eventType });
    logger_1.logger.info(`Webhook received: ${eventType} (${eventId})`);
    // Respond quickly to Razorpay
    res.status(200).json({ received: true });
});
/**
 * Process webhook event — called by worker or directly for simulation
 */
async function processWebhookEvent(eventId, eventType) {
    const event = await WebhookEvent_1.WebhookEvent.findOne({ eventId });
    if (!event || event.processed)
        return;
    try {
        const payload = event.payload;
        const paymentEntity = payload.payload?.payment?.entity;
        const linkEntity = payload.payload?.payment_link?.entity;
        switch (eventType) {
            case 'payment.failed': {
                if (!paymentEntity)
                    break;
                // Find or create payment record
                let payment = await Payment_1.Payment.findOne({ razorpayPaymentId: paymentEntity.id });
                if (!payment) {
                    payment = await Payment_1.Payment.create({
                        razorpayPaymentId: paymentEntity.id,
                        razorpayOrderId: paymentEntity.order_id,
                        amount: paymentEntity.amount,
                        currency: paymentEntity.currency || 'INR',
                        status: constants_1.PAYMENT_STATUS.FAILED,
                        method: paymentEntity.method,
                        failureReason: paymentEntity.error_description,
                        failureCode: paymentEntity.error_code,
                        failedAt: new Date(),
                    });
                }
                // Create recovery case
                if (payment.merchantId) {
                    await recovery_service_1.recoveryService.createRecoveryCase(payment._id.toString(), payment.merchantId.toString());
                }
                await auditService_1.auditService.log({
                    merchantId: payment.merchantId?.toString() || 'unknown',
                    actorType: constants_1.ACTOR_TYPE.RAZORPAY,
                    action: 'payment.failed',
                    entityType: 'Payment',
                    entityId: payment._id.toString(),
                    metadata: { amount: paymentEntity.amount, method: paymentEntity.method },
                });
                if (payment.merchantId) {
                    await redis_1.cache.delPattern(`recoverai:dashboard:${payment.merchantId.toString()}:*`);
                }
                break;
            }
            case 'payment.captured': {
                if (!paymentEntity)
                    break;
                await Payment_1.Payment.findOneAndUpdate({ razorpayPaymentId: paymentEntity.id }, { status: constants_1.PAYMENT_STATUS.CAPTURED, capturedAt: new Date() });
                // Check if there's an open recovery case to close
                const payment = await Payment_1.Payment.findOne({ razorpayPaymentId: paymentEntity.id });
                if (payment) {
                    const recoveryCase = await RecoveryCase_1.RecoveryCase.findOne({ paymentId: payment._id });
                    if (recoveryCase) {
                        await recovery_service_1.recoveryService.markRecovered(recoveryCase._id.toString(), paymentEntity.amount);
                    }
                    if (payment.merchantId) {
                        await redis_1.cache.delPattern(`recoverai:dashboard:${payment.merchantId.toString()}:*`);
                    }
                }
                break;
            }
            case 'payment_link.paid': {
                if (!linkEntity)
                    break;
                // Find recovery case by reference_id
                const referenceId = linkEntity.reference_id;
                if (referenceId?.startsWith('recovery-')) {
                    const caseId = referenceId.replace('recovery-', '');
                    await recovery_service_1.recoveryService.markRecovered(caseId, linkEntity.amount);
                    await auditService_1.auditService.log({
                        merchantId: 'unknown',
                        actorType: constants_1.ACTOR_TYPE.RAZORPAY,
                        action: 'payment_link.paid',
                        entityType: 'RecoveryCase',
                        entityId: caseId,
                        after: { recoveredAmount: linkEntity.amount },
                    });
                }
                break;
            }
            default:
                logger_1.logger.info(`Webhook: Unhandled event type: ${eventType}`);
        }
        await (0, webhookService_1.markWebhookProcessed)(eventId);
    }
    catch (error) {
        await (0, webhookService_1.markWebhookProcessed)(eventId, error.message);
        throw error; // Allow BullMQ to retry
    }
}
exports.getWebhookEvents = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const [events, total] = await Promise.all([
        WebhookEvent_1.WebhookEvent.find()
            .sort({ receivedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        WebhookEvent_1.WebhookEvent.countDocuments(),
    ]);
    (0, apiResponse_1.sendSuccess)(res, events, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});
//# sourceMappingURL=webhook.controller.js.map