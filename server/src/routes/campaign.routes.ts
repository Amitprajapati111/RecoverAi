import { Router } from 'express';
import * as campaignController from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, campaignController.getCampaigns);
router.post('/', authenticate, campaignController.createCampaign);
router.put('/:id', authenticate, campaignController.updateCampaign);
router.patch('/:id/toggle', authenticate, campaignController.toggleCampaign);

export default router;
