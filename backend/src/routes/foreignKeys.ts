import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import { listForeignKeys, createForeignKey, deleteForeignKey } from '../controllers/foreignKeys.controller';

const router = Router();

router.use(authenticate);

router.get('/foreign-keys', requirePermission('data.view'), listForeignKeys);
router.post('/foreign-keys', requirePermission('data.import'), createForeignKey);
router.delete('/foreign-keys/:id', requirePermission('data.import'), deleteForeignKey);

export default router;
