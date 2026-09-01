import { Router } from 'express';
import * as recoveryController from '../controllers/recovery.controller';
import { authenticate, adminOrAbove, analystOrAbove } from '../middleware/auth.middleware';

const router = Router();

router.get('/cases', authenticate, recoveryController.getCases);
router.get('/cases/:id', authenticate, recoveryController.getCaseById);
router.post('/cases/:id/analyze', authenticate, analystOrAbove, recoveryController.triggerAnalysis);
router.post('/cases/:id/approve', authenticate, adminOrAbove, recoveryController.approveAction);
router.post('/cases/:id/reject', authenticate, adminOrAbove, recoveryController.rejectAction);
router.post('/cases/:id/stop', authenticate, adminOrAbove, recoveryController.stopRecovery);

export default router;
