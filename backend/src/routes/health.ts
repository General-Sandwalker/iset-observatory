import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'API is healthy' });
});

router.get('/health/db', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, message: 'Database is healthy', timestamp: result.rows[0].now });
  } catch (error) {
    res.status(503).json({ success: false, message: 'Database connection failed' });
  }
});

export default router;
