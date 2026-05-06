import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import {
  listSavedQueries,
  createSavedQuery,
  updateSavedQuery,
  deleteSavedQuery,
  executeSavedQuery,
} from '../controllers/savedQueries.controller';

const router = Router();

router.use(authenticate);

router.get('/saved-queries', requirePermission('analytics.view'), listSavedQueries);
router.post('/saved-queries', requirePermission('analytics.create'), createSavedQuery);
router.put('/saved-queries/:id', requirePermission('analytics.create'), updateSavedQuery);
router.delete('/saved-queries/:id', requirePermission('analytics.create'), deleteSavedQuery);
router.post('/saved-queries/:id/execute', requirePermission('analytics.view'), executeSavedQuery);

export default router;
