import { Queue } from 'bullmq';
export declare const webhookQueue: Queue<any, any, string, any, any, string>;
export declare const aiAnalysisQueue: Queue<any, any, string, any, any, string>;
export declare const recoveryQueue: Queue<any, any, string, any, any, string>;
export declare const notificationQueue: Queue<any, any, string, any, any, string>;
export declare const analyticsQueue: Queue<any, any, string, any, any, string>;
export declare function enqueueWebhookJob(data: {
    eventId: string;
    eventType: string;
    merchantId?: string;
}): Promise<void>;
export declare function enqueueAIAnalysis(data: {
    recoveryCaseId: string;
    merchantId: string;
    priority?: number;
}): Promise<void>;
export declare function enqueueRecoveryAction(data: {
    recoveryCaseId: string;
    merchantId: string;
    action: string;
    delayMinutes?: number;
}): Promise<void>;
export declare function getQueueStats(): Promise<{
    webhook: {
        [index: string]: number;
    };
    aiAnalysis: {
        [index: string]: number;
    };
    recovery: {
        [index: string]: number;
    };
    notification: {
        [index: string]: number;
    };
}>;
//# sourceMappingURL=queues.d.ts.map