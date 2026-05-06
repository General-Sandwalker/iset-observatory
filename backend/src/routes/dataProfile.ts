import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import { profileDataset } from '../controllers/dataProfile.controller';

const router = Router();

router.use(authenticate);

router.get('/datasets/:id/profile', requirePermission('data.view'), profileDataset);

export default router;
