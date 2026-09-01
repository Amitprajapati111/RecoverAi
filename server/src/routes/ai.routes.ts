import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/decisions', authenticate, aiController.getDecisions);
router.get('/decisions/:id', authenticate, aiController.getDecisionById);
router.get('/evaluations', authenticate, aiController.getEvaluations);
router.post('/ask', authenticate, aiController.askRecoverAI);

export default router;
