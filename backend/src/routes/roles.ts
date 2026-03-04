import { Router } from 'express';
import {
  listRoles, getRole, createRole, updateRole, deleteRole,
  listPermissions,
} from '../controllers/roles.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/permissions', requirePermission('roles.view'), listPermissions);
router.get('/',    requirePermission('roles.view'),   listRoles);
router.get('/:id', requirePermission('roles.view'),   getRole);
router.post('/',   requirePermission('roles.create'),  createRole);
router.put('/:id', requirePermission('roles.edit'),    updateRole);
router.delete('/:id', requirePermission('roles.delete'), deleteRole);

export default router;
