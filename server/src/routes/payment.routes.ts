import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, paymentController.getPayments);
router.get('/failed', authenticate, paymentController.getFailedPayments);
router.get('/:id', authenticate, paymentController.getPaymentById);

export default router;
