import { Router } from 'express';
import * as policyController from '../controllers/policy.controller';
import { authenticate, adminOrAbove } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, policyController.getPolicy);
router.put('/', authenticate, adminOrAbove, policyController.updatePolicy);

export default router;
