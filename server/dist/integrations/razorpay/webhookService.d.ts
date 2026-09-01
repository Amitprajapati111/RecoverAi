export declare function validateRazorpayWebhookSignature(rawBody: string, signature: string, secret: string): boolean;
export declare function checkWebhookIdempotency(eventId: string): Promise<boolean>;
export declare function storeWebhookEvent(params: {
    eventId: string;
    eventType: string;
    payload: Record<string, unknown>;
    signature?: string;
    merchantId?: string;
}): Promise<string | null>;
export declare function markWebhookProcessed(eventId: string, error?: string): Promise<void>;
//# sourceMappingURL=webhookService.d.ts.map