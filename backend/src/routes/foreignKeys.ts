import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import { listForeignKeys, createForeignKey, deleteForeignKey, aiSuggestForeignKeys } from '../controllers/foreignKeys.controller';

const router = Router();
router.use(authenticate);

router.get('/foreign-keys', requirePermission('data.view'), listForeignKeys);
router.post('/foreign-keys', requirePermission('data.import'), createForeignKey);
router.post('/foreign-keys/ai-suggest', requirePermission('data.view'), aiSuggestForeignKeys);
router.delete('/foreign-keys/:id', requirePermission('data.import'), deleteForeignKey);

export default router;
