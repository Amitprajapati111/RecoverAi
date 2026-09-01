"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentLinkService = exports.PaymentLinkService = void 0;
const razorpayClient_1 = require("./razorpayClient");
const logger_1 = require("../../utils/logger");
const uuid_1 = require("uuid");
/**
 * Razorpay Payment Links Service
 * All operations use TEST MODE keys only in hackathon implementation.
 */
class PaymentLinkService {
    async create(params) {
        if (!(0, razorpayClient_1.isRazorpayConfigured)()) {
            return this.createSimulated(params);
        }
        try {
            const client = (0, razorpayClient_1.getRazorpayClient)();
            const expireAt = params.expiryMinutes
                ? Math.floor(Date.now() / 1000) + params.expiryMinutes * 60
                : Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24h default
            const linkData = {
                amount: params.amount,
                currency: params.currency || 'INR',
                description: params.description || 'Payment Recovery Link',
                expire_by: expireAt,
                reference_id: params.referenceId || (0, uuid_1.v4)(),
                reminder_enable: true,
                notes: {
                    source: 'RecoverAI',
                    ...params.notes,
                },
            };
            if (params.customerName || params.customerEmail || params.customerPhone) {
                linkData.customer = {
                    name: params.customerName,
                    email: params.customerEmail,
                    contact: params.customerPhone,
                };
                linkData.notify = {
                    sms: Boolean(params.customerPhone),
                    email: Boolean(params.customerEmail),
                };
            }
            const result = await client.paymentLink.create(linkData);
            logger_1.logger.info('Payment Link created via Razorpay', {
                linkId: result.id,
                amount: params.amount,
                referenceId: params.referenceId,
            });
            return {
                id: result.id,
                short_url: result.short_url,
                status: result.status,
                amount: result.amount,
                currency: result.currency,
                reference_id: result.reference_id,
                isSimulated: false,
            };
        }
        catch (error) {
            logger_1.logger.error('Payment Link creation failed, falling back to simulation', error);
            return this.createSimulated(params);
        }
    }
    createSimulated(params) {
        const fakeId = `plink_sim_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 14)}`;
        logger_1.logger.info('Payment Link: returning SIMULATED result (no Razorpay credentials)');
        return {
            id: fakeId,
            short_url: `https://rzp.io/sim/${fakeId.slice(-8)}`,
            status: 'created',
            amount: params.amount,
            currency: params.currency || 'INR',
            reference_id: params.referenceId,
            isSimulated: true,
        };
    }
    async fetch(linkId) {
        if (!(0, razorpayClient_1.isRazorpayConfigured)() || linkId.startsWith('plink_sim_')) {
            return null; // Simulated links can't be fetched
        }
        try {
            const client = (0, razorpayClient_1.getRazorpayClient)();
            return await client.paymentLink.fetch(linkId);
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch payment link', { linkId, error });
            return null;
        }
    }
    async cancel(linkId) {
        if (!(0, razorpayClient_1.isRazorpayConfigured)() || linkId.startsWith('plink_sim_')) {
            return true; // Simulated — no-op
        }
        try {
            const client = (0, razorpayClient_1.getRazorpayClient)();
            await client.paymentLink.cancel(linkId);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to cancel payment link', { linkId, error });
            return false;
        }
    }
}
exports.PaymentLinkService = PaymentLinkService;
exports.paymentLinkService = new PaymentLinkService();
//# sourceMappingURL=paymentLinkService.js.map