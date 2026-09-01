import { Document, Types } from 'mongoose';
export interface IWebhookEvent extends Document {
    merchantId?: Types.ObjectId;
    eventId: string;
    eventType: string;
    payload: Record<string, unknown>;
    signature?: string;
    processed: boolean;
    processingAttempts: number;
    receivedAt: Date;
    processedAt?: Date;
    error?: string;
    jobId?: string;
}
export declare const WebhookEvent: import("mongoose").Model<IWebhookEvent, {}, {}, {}, Document<unknown, {}, IWebhookEvent, {}, {}> & IWebhookEvent & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=WebhookEvent.d.ts.map