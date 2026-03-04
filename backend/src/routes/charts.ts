import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import {
  createChart,
  listCharts,
  getChart,
  updateChart,
  deleteChart,
  getChartData,
} from '../controllers/charts.controller';

const router = Router();

router.use(authenticate);

router.post('/', requirePermission('analytics.create'), createChart);
router.get('/', requirePermission('analytics.view'), listCharts);
router.get('/:id', requirePermission('analytics.view'), getChart);
router.put('/:id', requirePermission('analytics.create'), updateChart);
router.delete('/:id', requirePermission('analytics.create'), deleteChart);
router.get('/:id/data', requirePermission('analytics.view'), getChartData);

export default router;
