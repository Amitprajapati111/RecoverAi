import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public webhook endpoint for Razorpay
router.post('/razorpay', webhookController.receiveWebhook);

// Internal authenticated history
router.get('/events', authenticate, webhookController.getWebhookEvents);

export default router;
