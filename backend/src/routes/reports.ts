import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import {
  listReports, getReport, generateReportHandler, updateReport, deleteReport,
} from '../controllers/reports.controller';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('reports.view'), listReports);
router.get('/:id', requirePermission('reports.view'), getReport);
router.post('/generate', requirePermission('reports.generate'), generateReportHandler);
router.put('/:id', requirePermission('reports.generate'), updateReport);
router.delete('/:id', requirePermission('reports.generate'), deleteReport);

export default router;
