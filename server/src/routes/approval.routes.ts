import { Router } from 'express';
import * as approvalController from '../controllers/approval.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/pending', authenticate, approvalController.getPendingApprovals);

export default router;
