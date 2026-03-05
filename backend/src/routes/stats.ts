import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [datasetsRes, rowsRes, usersRes, chartsRes, dashboardsRes, aiRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS count FROM datasets WHERE status = 'imported'`),
      pool.query(`SELECT COALESCE(SUM(row_count), 0) AS total FROM datasets WHERE status = 'imported'`),
      pool.query(`SELECT COUNT(*) AS count FROM users WHERE is_active = true`),
      pool.query(`SELECT COUNT(*) AS count FROM charts`),
      pool.query(`SELECT COUNT(*) AS count FROM dashboards`),
      pool.query(
        `SELECT COUNT(*) AS count FROM ai_queries WHERE created_at >= NOW() - INTERVAL '30 days'`
      ).catch(() => ({ rows: [{ count: '0' }] })),
    ]);

    res.json({
      success: true,
      data: {
        datasets: parseInt(datasetsRes.rows[0].count, 10),
        totalRecords: parseInt(rowsRes.rows[0].total, 10),
        activeUsers: parseInt(usersRes.rows[0].count, 10),
        charts: parseInt(chartsRes.rows[0].count, 10),
        dashboards: parseInt(dashboardsRes.rows[0].count, 10),
        aiQueriesThisMonth: parseInt(aiRes.rows[0].count, 10),
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to load stats' });
  }
});

export default router;
