import { Request, Response } from 'express';
import pool from '../config/database';

// ─── Create dashboard ────────────────────────────────────────────

export async function createDashboard(req: Request, res: Response): Promise<void> {
  try {
    const { title, description } = req.body;
    if (!title) {
      res.status(400).json({ success: false, message: 'Title is required.' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO dashboards (title, description, layout, created_by)
       VALUES ($1, $2, '[]', $3) RETURNING *`,
      [title, description || '', req.user!.id],
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to create dashboard.' });
  }
}

// ─── List dashboards ─────────────────────────────────────────────

export async function listDashboards(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT d.*, u.full_name AS created_by_name
       FROM dashboards d
       LEFT JOIN users u ON u.id = d.created_by
       ORDER BY d.updated_at DESC`,
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List dashboards error:', error);
    res.status(500).json({ success: false, message: 'Failed to list dashboards.' });
  }
}

// ─── Get single dashboard ────────────────────────────────────────

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT d.*, u.full_name AS created_by_name
       FROM dashboards d
       LEFT JOIN users u ON u.id = d.created_by
       WHERE d.id = $1`,
      [req.params.id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dashboard not found.' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to get dashboard.' });
  }
}

// ─── Update dashboard (title, description, layout) ──────────────

export async function updateDashboard(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, layout } = req.body;

    const result = await pool.query(
      `UPDATE dashboards
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           layout = COALESCE($3, layout),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [title, description, layout ? JSON.stringify(layout) : null, req.params.id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dashboard not found.' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to update dashboard.' });
  }
}

// ─── Delete dashboard ────────────────────────────────────────────

export async function deleteDashboard(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      'DELETE FROM dashboards WHERE id = $1 RETURNING id',
      [req.params.id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dashboard not found.' });
      return;
    }
    res.json({ success: true, message: 'Dashboard deleted.' });
  } catch (error) {
    console.error('Delete dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete dashboard.' });
  }
}
