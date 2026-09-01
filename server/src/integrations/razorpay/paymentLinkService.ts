import { getRazorpayClient, isRazorpayConfigured } from './razorpayClient';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePaymentLinkParams {
  amount: number; // in paise
  currency?: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  referenceId?: string;
  expiryMinutes?: number;
  notes?: Record<string, string>;
}

export interface PaymentLinkResult {
  id: string;
  short_url: string;
  status: string;
  amount: number;
  currency: string;
  reference_id?: string;
  isSimulated: boolean;
}

/**
 * Razorpay Payment Links Service
 * All operations use TEST MODE keys only in hackathon implementation.
 */
export class PaymentLinkService {
  async create(params: CreatePaymentLinkParams): Promise<PaymentLinkResult> {
    if (!isRazorpayConfigured()) {
      return this.createSimulated(params);
    }

    try {
      const client = getRazorpayClient();
      const expireAt = params.expiryMinutes
        ? Math.floor(Date.now() / 1000) + params.expiryMinutes * 60
        : Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24h default

      const linkData: Record<string, unknown> = {
        amount: params.amount,
        currency: params.currency || 'INR',
        description: params.description || 'Payment Recovery Link',
        expire_by: expireAt,
        reference_id: params.referenceId || uuidv4(),
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

      const result = await (client.paymentLink as any).create(linkData);

      logger.info('Payment Link created via Razorpay', {
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
    } catch (error) {
      logger.error('Payment Link creation failed, falling back to simulation', error);
      return this.createSimulated(params);
    }
  }

  private createSimulated(params: CreatePaymentLinkParams): PaymentLinkResult {
    const fakeId = `plink_sim_${uuidv4().replace(/-/g, '').slice(0, 14)}`;
    logger.info('Payment Link: returning SIMULATED result (no Razorpay credentials)');
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

  async fetch(linkId: string): Promise<PaymentLinkResult | null> {
    if (!isRazorpayConfigured() || linkId.startsWith('plink_sim_')) {
      return null; // Simulated links can't be fetched
    }
    try {
      const client = getRazorpayClient();
      return await (client.paymentLink as any).fetch(linkId);
    } catch (error) {
      logger.error('Failed to fetch payment link', { linkId, error });
      return null;
    }
  }

  async cancel(linkId: string): Promise<boolean> {
    if (!isRazorpayConfigured() || linkId.startsWith('plink_sim_')) {
      return true; // Simulated — no-op
    }
    try {
      const client = getRazorpayClient();
      await (client.paymentLink as any).cancel(linkId);
      return true;
    } catch (error) {
      logger.error('Failed to cancel payment link', { linkId, error });
      return false;
    }
  }
}

export const paymentLinkService = new PaymentLinkService();
