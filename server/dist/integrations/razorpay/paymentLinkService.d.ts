export interface CreatePaymentLinkParams {
    amount: number;
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
export declare class PaymentLinkService {
    create(params: CreatePaymentLinkParams): Promise<PaymentLinkResult>;
    private createSimulated;
    fetch(linkId: string): Promise<PaymentLinkResult | null>;
    cancel(linkId: string): Promise<boolean>;
}
export declare const paymentLinkService: PaymentLinkService;
//# sourceMappingURL=paymentLinkService.d.ts.map