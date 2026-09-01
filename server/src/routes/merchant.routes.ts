import { Router } from 'express';
import * as merchantController from '../controllers/merchant.controller';
import { authenticate, adminOrAbove, ownerOnly } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticate, merchantController.getMerchantProfile);
router.put('/profile', authenticate, adminOrAbove, merchantController.updateMerchantProfile);
router.post('/razorpay-credentials', authenticate, ownerOnly, merchantController.updateRazorpayCredentials);

export default router;
