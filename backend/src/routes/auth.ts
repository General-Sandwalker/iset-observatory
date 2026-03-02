import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/auth/login — Public
router.post('/login', login);

// GET /api/auth/me — Protected
router.get('/me', authenticate, getMe);

export default router;
