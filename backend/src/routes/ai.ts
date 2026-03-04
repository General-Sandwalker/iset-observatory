import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import {
  nlQuery,
  getChatHistory,
  clearChatHistory,
  listQueryableTables,
  generateSurveyHandler,
} from '../controllers/ai.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// NL-to-SQL chat
router.post('/query', requirePermission('ai.query'), nlQuery);
router.get('/history', requirePermission('ai.query'), getChatHistory);
router.delete('/history', requirePermission('ai.query'), clearChatHistory);

// Available tables for the AI context panel
router.get('/tables', requirePermission('ai.query'), listQueryableTables);

// Survey generator
router.post('/survey/generate', requirePermission('surveys.create'), generateSurveyHandler);

export default router;
