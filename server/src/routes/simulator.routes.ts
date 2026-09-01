import { Router } from 'express';
import * as simulatorController from '../controllers/simulator.controller';
import { authenticateOrDemo } from '../middleware/auth.middleware';

const router = Router();

router.post('/run', authenticateOrDemo, simulatorController.runSimulation);
router.post('/winning-demo', authenticateOrDemo, simulatorController.runWinningDemo);
router.post('/clear', authenticateOrDemo, simulatorController.clearSimulatedData);
router.get('/stats', authenticateOrDemo, simulatorController.getSimulatorStats);
router.post('/demo/payment', authenticateOrDemo, simulatorController.createDemoPayment);
router.post('/demo/payment/fail', authenticateOrDemo, simulatorController.simulatePaymentFailure);
router.post('/demo/payment/success', authenticateOrDemo, simulatorController.simulatePaymentSuccess);
router.post('/demo/analysis', authenticateOrDemo, simulatorController.triggerDemoAnalysis);
router.post('/demo/webhook/duplicate', authenticateOrDemo, simulatorController.triggerDuplicateWebhookDemo);

export default router;
