import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const safe = async (q: string): Promise<number> => {
      try {
        const r = await pool.query(q);
        return parseInt(r.rows[0]?.count ?? r.rows[0]?.total ?? '0', 10) || 0;
      } catch {
        return 0;
      }
    };

    const [datasets, totalRecords, activeUsers, charts, dashboards, aiQueriesThisMonth] =
      await Promise.all([
        safe(`SELECT COUNT(*) AS count FROM datasets WHERE status = 'imported'`),
        safe(`SELECT COALESCE(SUM(row_count), 0) AS total FROM datasets WHERE status = 'imported'`),
        safe(`SELECT COUNT(*) AS count FROM users WHERE is_active = true`),
        safe(`SELECT COUNT(*) AS count FROM charts`),
        safe(`SELECT COUNT(*) AS count FROM dashboards`),
        safe(`SELECT COUNT(*) AS count FROM ai_queries WHERE created_at >= NOW() - INTERVAL '30 days'`),
      ]);

    res.json({ success: true, data: { datasets, totalRecords, activeUsers, charts, dashboards, aiQueriesThisMonth } });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to load stats' });
  }
});

export default router;
