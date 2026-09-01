import crypto from 'crypto';
import { env } from '../../config/env';
import { WebhookEvent } from '../../models/WebhookEvent';
import { logger } from '../../utils/logger';

export function validateRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}

export async function checkWebhookIdempotency(eventId: string): Promise<boolean> {
  const existing = await WebhookEvent.findOne({ eventId });
  return Boolean(existing?.processed);
}

export async function storeWebhookEvent(params: {
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  signature?: string;
  merchantId?: string;
}): Promise<string | null> {
  try {
    const event = await WebhookEvent.create({
      merchantId: params.merchantId,
      eventId: params.eventId,
      eventType: params.eventType,
      payload: params.payload,
      signature: params.signature,
      processed: false,
      processingAttempts: 0,
      receivedAt: new Date(),
    });
    return (event._id as any).toString();
  } catch (error: any) {
    // Duplicate key = already received this event
    if (error.code === 11000) {
      logger.info(`Webhook already received: ${params.eventId}`);
      return null; // Already processed
    }
    throw error;
  }
}

export async function markWebhookProcessed(
  eventId: string,
  error?: string
): Promise<void> {
  await WebhookEvent.updateOne(
    { eventId },
    {
      processed: !error,
      processedAt: new Date(),
      error,
      $inc: { processingAttempts: 1 },
    }
  );
}
