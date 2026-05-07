import { Request, Response } from 'express';
import pool from '../config/database';
import { suggestForeignKeys } from '../services/ai';

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
    `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [sourceTable, sourceColumn]
  );
  if (srcColCheck.rows.length === 0) {
    res.status(400).json({ success: false, message: `Column "${sourceColumn}" not found in table "${sourceTable}".` });
    return;
  }

  const tgtColCheck = await pool.query(
    `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [targetTable, targetColumn]
  );
  if (tgtColCheck.rows.length === 0) {
    res.status(400).json({ success: false, message: `Column "${targetColumn}" not found in table "${targetTable}".` });
    return;
  }

  const srcType = srcColCheck.rows[0].udt_name || srcColCheck.rows[0].data_type;
  const tgtType = tgtColCheck.rows[0].udt_name || tgtColCheck.rows[0].data_type;

  const numericTypes = ['int4', 'int8', 'float8', 'numeric', 'integer', 'bigint', 'double precision', 'real', 'decimal', 'smallint', 'int2'];
  const isSrcNumeric = numericTypes.includes(srcType);
  const isTgtNumeric = numericTypes.includes(tgtType);
  const isSrcText = ['text', 'varchar', 'character varying', 'bpchar', 'char', 'character'].includes(srcType);
  const isTgtText = ['text', 'varchar', 'character varying', 'bpchar', 'char', 'character'].includes(tgtType);

  if ((isSrcNumeric && isTgtText) || (isSrcText && isTgtNumeric)) {
    res.status(400).json({
      success: false,
      message: `Type mismatch: "${sourceColumn}" is ${srcType} but "${targetColumn}" is ${tgtType}. Linking numeric to text columns may cause data inconsistency.`,
    });
    return;
  }

  const result = await pool.query(
    `INSERT INTO foreign_keys (source_table, source_column, target_table, target_column, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [sourceTable, sourceColumn, targetTable, targetColumn, req.user!.id]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create foreign key error:', error);
    res.status(500).json({ success: false, message: 'Failed to create foreign key link.' });
  }
}

export async function aiSuggestForeignKeys(req: Request, res: Response): Promise<void> {
  try {
    const dsResult = await pool.query(
      `SELECT d.table_name, d.column_mapping FROM datasets d
       WHERE d.status = 'imported' AND d.table_name IS NOT NULL
       ORDER BY d.name`
    );

    if (dsResult.rows.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const tableSchemas = [];
    for (const ds of dsResult.rows) {
      const cols = ds.column_mapping as Array<{ columnName: string; columnType: string }> || [];
      const schemaResult = await pool.query(
        `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = $1`,
        [ds.table_name]
      );
      const columns = schemaResult.rows.map((c: any) => ({
        name: c.column_name,
        type: c.udt_name || c.data_type || 'text',
      }));
      tableSchemas.push({ table: ds.table_name, columns });
    }

    const suggestions = await suggestForeignKeys(tableSchemas);
    res.json({ success: true, data: suggestions });
  } catch (error: any) {
    console.error('AI FK suggest error:', error);
    res.status(500).json({ success: false, message: error.message || 'AI suggestion failed.' });
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
