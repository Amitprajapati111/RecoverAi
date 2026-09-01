import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, dashboardController.getDashboard);
router.get('/system-status', authenticate, dashboardController.getSystemStatus);

export default router;
