import { Router } from 'express';
import { listUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/users.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/',    requirePermission('users.view'),   listUsers);
router.get('/:id', requirePermission('users.view'),   getUser);
router.post('/',   requirePermission('users.create'),  createUser);
router.put('/:id', requirePermission('users.edit'),    updateUser);
router.delete('/:id', requirePermission('users.delete'), deleteUser);

export default router;
