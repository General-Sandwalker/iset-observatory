import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import {
  listClients, getClient, createClient, updateClient, deleteClient, bulkImportClients,
} from '../controllers/clients.controller';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('clients.view'), listClients);
router.get('/:id', requirePermission('clients.view'), getClient);
router.post('/', requirePermission('clients.create'), createClient);
router.put('/:id', requirePermission('clients.edit'), updateClient);
router.delete('/:id', requirePermission('clients.delete'), deleteClient);
router.post('/bulk-import', requirePermission('clients.import'), bulkImportClients);

export default router;
