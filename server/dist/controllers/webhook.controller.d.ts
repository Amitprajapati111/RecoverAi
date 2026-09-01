import { Request, Response } from 'express';
/**
 * Webhook receiver — must respond quickly.
 * Validates signature, stores event, enqueues for async processing.
 */
export declare const receiveWebhook: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Process webhook event — called by worker or directly for simulation
 */
export declare function processWebhookEvent(eventId: string, eventType: string): Promise<void>;
export declare const getWebhookEvents: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=webhook.controller.d.ts.map