import { Router } from 'express';
import { authenticate, requirePermission, authorize } from '../middleware/auth';
import {
  listNotifications,
  createNotification,
  markRead,
  markAllRead,
  deleteNotification,
} from '../controllers/notifications.controller';

const router = Router();

router.use(authenticate);

router.get('/notifications', listNotifications);
router.post('/notifications', authorize('super_admin', 'admin'), createNotification);
router.patch('/notifications/read-all', markAllRead);
router.patch('/notifications/:id/read', markRead);
router.delete('/notifications/:id', deleteNotification);

export default router;
