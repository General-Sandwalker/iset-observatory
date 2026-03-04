import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import {
  createDashboard,
  listDashboards,
  getDashboard,
  updateDashboard,
  deleteDashboard,
} from '../controllers/dashboards.controller';

const router = Router();

router.use(authenticate);

router.post('/', requirePermission('analytics.create'), createDashboard);
router.get('/', requirePermission('analytics.view'), listDashboards);
router.get('/:id', requirePermission('analytics.view'), getDashboard);
router.put('/:id', requirePermission('analytics.create'), updateDashboard);
router.delete('/:id', requirePermission('analytics.create'), deleteDashboard);

export default router;
