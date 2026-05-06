import { Request, Response } from 'express';
import pool from '../config/database';

export async function listForeignKeys(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT fk.*, u.full_name AS created_by_name
       FROM foreign_keys fk
       LEFT JOIN users u ON u.id = fk.created_by
       ORDER BY fk.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List foreign keys error:', error);
    res.status(500).json({ success: false, message: 'Failed to list foreign keys.' });
  }
}

export async function createForeignKey(req: Request, res: Response): Promise<void> {
  try {
    const { sourceTable, sourceColumn, targetTable, targetColumn } = req.body;

    if (!sourceTable || !sourceColumn || !targetTable || !targetColumn) {
      res.status(400).json({ success: false, message: 'sourceTable, sourceColumn, targetTable, and targetColumn are required.' });
      return;
    }

    const dsResult = await pool.query(
      `SELECT table_name FROM datasets WHERE table_name = $1 AND status = 'imported'`,
      [sourceTable]
    );
    if (dsResult.rows.length === 0) {
      res.status(400).json({ success: false, message: `Source table "${sourceTable}" not found or not imported.` });
      return;
    }

    const dtResult = await pool.query(
      `SELECT table_name FROM datasets WHERE table_name = $1 AND status = 'imported'`,
      [targetTable]
    );
    if (dtResult.rows.length === 0) {
      res.status(400).json({ success: false, message: `Target table "${targetTable}" not found or not imported.` });
      return;
    }

    const srcColCheck = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
      [sourceTable, sourceColumn]
    );
    if (srcColCheck.rows.length === 0) {
      res.status(400).json({ success: false, message: `Column "${sourceColumn}" not found in table "${sourceTable}".` });
      return;
    }

    const tgtColCheck = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
      [targetTable, targetColumn]
    );
    if (tgtColCheck.rows.length === 0) {
      res.status(400).json({ success: false, message: `Column "${targetColumn}" not found in table "${targetTable}".` });
      return;
    }

    const result = await pool.query(
      `INSERT INTO foreign_keys (source_table, source_column, target_table, target_column, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [sourceTable, sourceColumn, targetTable, targetColumn, req.user!.id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({ success: false, message: 'This foreign key link already exists.' });
      return;
    }
    console.error('Create foreign key error:', error);
    res.status(500).json({ success: false, message: 'Failed to create foreign key.' });
  }
}

export async function deleteForeignKey(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM foreign_keys WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Foreign key link not found.' });
      return;
    }

    res.json({ success: true, message: 'Foreign key link deleted.' });
  } catch (error) {
    console.error('Delete foreign key error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete foreign key.' });
  }
}
