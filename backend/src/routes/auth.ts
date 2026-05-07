import { Router } from 'express';
import { login, clientLogin, getMe, updateMe, changePassword, updatePreferences } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/auth/login — Public (staff login)
router.post('/login', login);

// POST /api/auth/client-login — Public (client login with username)
router.post('/client-login', clientLogin);

// GET /api/auth/me — Protected
router.get('/me', authenticate, getMe);

// PUT /api/auth/me — update display name / email
router.put('/me', authenticate, updateMe);

// PUT /api/auth/me/password — change password
router.put('/me/password', authenticate, changePassword);

// PATCH /api/auth/me/preferences — persist theme / other prefs
router.patch('/me/preferences', authenticate, updatePreferences);

export default router;
