import { Request, Response } from 'express';
import pool from '../config/database';

export async function listSavedQueries(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT sq.*, u.full_name AS created_by_name
       FROM saved_queries sq
       LEFT JOIN users u ON u.id = sq.created_by
       WHERE sq.created_by = $1 OR sq.is_public = true
       ORDER BY sq.updated_at DESC`,
      [req.user!.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List saved queries error:', error);
    res.status(500).json({ success: false, message: 'Failed to list saved queries.' });
  }
}

export async function createSavedQuery(req: Request, res: Response): Promise<void> {
  try {
    const { title, sql, description, isPublic } = req.body;

    if (!title || !sql) {
      res.status(400).json({ success: false, message: 'title and sql are required.' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO saved_queries (title, sql, description, is_public, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, sql, description || null, isPublic ?? false, req.user!.id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create saved query error:', error);
    res.status(500).json({ success: false, message: 'Failed to create saved query.' });
  }
}

export async function updateSavedQuery(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, sql, description, isPublic } = req.body;

    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (title !== undefined) {
      fields.push(`title = $${paramIdx++}`);
      values.push(title);
    }
    if (sql !== undefined) {
      fields.push(`sql = $${paramIdx++}`);
      values.push(sql);
    }
    if (description !== undefined) {
      fields.push(`description = $${paramIdx++}`);
      values.push(description);
    }
    if (isPublic !== undefined) {
      fields.push(`is_public = $${paramIdx++}`);
      values.push(isPublic);
    }

    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) {
      res.status(400).json({ success: false, message: 'No fields to update.' });
      return;
    }

    values.push(id, req.user!.id);

    const result = await pool.query(
      `UPDATE saved_queries SET ${fields.join(', ')}
       WHERE id = $${paramIdx++} AND created_by = $${paramIdx++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Saved query not found or not owned by you.' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update saved query error:', error);
    res.status(500).json({ success: false, message: 'Failed to update saved query.' });
  }
}

export async function deleteSavedQuery(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (req.user!.role === 'super_admin') {
      const result = await pool.query('DELETE FROM saved_queries WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Saved query not found.' });
        return;
      }
      res.json({ success: true, message: 'Saved query deleted.' });
      return;
    }

    const result = await pool.query(
      'DELETE FROM saved_queries WHERE id = $1 AND created_by = $2 RETURNING *',
      [id, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Saved query not found or not owned by you.' });
      return;
    }

    res.json({ success: true, message: 'Saved query deleted.' });
  } catch (error) {
    console.error('Delete saved query error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete saved query.' });
  }
}

export async function executeSavedQuery(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const sqResult = await pool.query(
      `SELECT * FROM saved_queries WHERE id = $1 AND (created_by = $2 OR is_public = true)`,
      [id, req.user!.id]
    );

    if (sqResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Saved query not found.' });
      return;
    }

    const sqlQuery: string = sqResult.rows[0].sql.trim();

    const forbidden = /^(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\s/i;
    if (!sqlQuery.toUpperCase().startsWith('SELECT') || forbidden.test(sqlQuery)) {
      res.status(400).json({ success: false, message: 'Only SELECT queries are allowed.' });
      return;
    }

    const limitedSql = sqlQuery.replace(/;\s*$/, '') + ' LIMIT 1000';
    const result = await pool.query(limitedSql);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Execute saved query error:', error);
    res.status(500).json({ success: false, message: 'Failed to execute saved query.' });
  }
}
