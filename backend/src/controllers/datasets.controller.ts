import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import pool from '../config/database';
import { parseFile, readAllRows } from '../services/parser';
import { createDynamicTable, bulkInsert, dropDynamicTable, ColumnMapping } from '../services/tableBuilder';

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// ─── Upload a file ──────────────────────────────────────────────

export async function uploadFile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded.' });
      return;
    }

    const { originalname, filename } = req.file;

    // Register in datasets table
    const result = await pool.query(
      `INSERT INTO datasets (name, file_name, status, uploaded_by)
       VALUES ($1, $2, 'uploaded', $3) RETURNING *`,
      [originalname, filename, req.user!.id],
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed.' });
  }
}

// ─── Preview (parse headers + sample rows) ──────────────────────

export async function previewDataset(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const dsResult = await pool.query('SELECT * FROM datasets WHERE id = $1', [id]);
    if (dsResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dataset not found.' });
      return;
    }

    const ds = dsResult.rows[0];
    const filePath = path.join(UPLOAD_DIR, ds.file_name);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'File not found on disk.' });
      return;
    }

    const parsed = await parseFile(filePath);

    res.json({
      success: true,
      data: {
        dataset: ds,
        headers: parsed.headers,
        preview: parsed.preview,
        totalRows: parsed.totalRows,
      },
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ success: false, message: 'Failed to preview file.' });
  }
}

// ─── Create table + bulk import ─────────────────────────────────

export async function importDataset(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { tableName, columns } = req.body as {
      tableName: string;
      columns: ColumnMapping[];
    };

    if (!tableName || !columns || columns.length === 0) {
      res.status(400).json({ success: false, message: 'tableName and columns are required.' });
      return;
    }

    // Check dataset exists
    const dsResult = await pool.query('SELECT * FROM datasets WHERE id = $1', [id]);
    if (dsResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dataset not found.' });
      return;
    }

    const ds = dsResult.rows[0];
    const filePath = path.join(UPLOAD_DIR, ds.file_name);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'File not found on disk.' });
      return;
    }

    // Update status → processing
    await pool.query(
      `UPDATE datasets SET status = 'processing', updated_at = NOW() WHERE id = $1`,
      [id],
    );

    // 1) Create the dynamic table
    const actualTableName = await createDynamicTable(tableName, columns);

    // 2) Read all rows from file
    const rows = await readAllRows(filePath);

    // 3) Bulk insert
    const insertedCount = await bulkInsert(actualTableName, columns, rows);

    // 4) Mark as complete
    await pool.query(
      `UPDATE datasets
       SET status = 'imported',
           table_name = $1,
           row_count = $2,
           column_mapping = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [actualTableName, insertedCount, JSON.stringify(columns), id],
    );

    res.json({
      success: true,
      data: {
        tableName: actualTableName,
        rowsImported: insertedCount,
      },
    });
  } catch (error: any) {
    console.error('Import error:', error);
    // Revert status on failure
    await pool.query(
      `UPDATE datasets SET status = 'error', updated_at = NOW() WHERE id = $1`,
      [req.params.id],
    ).catch(() => {});
    res.status(500).json({ success: false, message: error.message || 'Import failed.' });
  }
}

// ─── List all datasets ──────────────────────────────────────────

export async function listDatasets(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT d.*, u.full_name AS uploaded_by_name
       FROM datasets d
       LEFT JOIN users u ON u.id = d.uploaded_by
       ORDER BY d.created_at DESC`,
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List datasets error:', error);
    res.status(500).json({ success: false, message: 'Failed to list datasets.' });
  }
}

// ─── Get a single dataset detail ────────────────────────────────

export async function getDataset(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT d.*, u.full_name AS uploaded_by_name
       FROM datasets d
       LEFT JOIN users u ON u.id = d.uploaded_by
       WHERE d.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dataset not found.' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get dataset error:', error);
    res.status(500).json({ success: false, message: 'Failed to get dataset.' });
  }
}

// ─── Query dynamic table data ───────────────────────────────────

export async function queryTable(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10), 200);
    const offset = (page - 1) * limit;
    const search = String(req.query.search || '').trim();
    const sortParam = String(req.query.sort || '').trim();
    const order = String(req.query.order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Get the table name from the dataset
    const dsResult = await pool.query('SELECT table_name FROM datasets WHERE id = $1', [id]);
    if (dsResult.rows.length === 0 || !dsResult.rows[0].table_name) {
      res.status(404).json({ success: false, message: 'Dataset or table not found.' });
      return;
    }

    const tableName = dsResult.rows[0].table_name as string;

    // Ensure it's a dynamic table
    if (!tableName.startsWith('dyn_')) {
      res.status(400).json({ success: false, message: 'Invalid table.' });
      return;
    }

    // Fetch columns for search / sort validation
    const colResult = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
      [tableName],
    );
    const validCols = colResult.rows.map((r) => r.column_name as string);

    // Build WHERE clause for search (cast all text-ish columns)
    const params: unknown[] = [];
    let where = '';
    if (search) {
      const conditions = validCols
        .filter((c) => c !== 'id')
        .map((c) => `"${c}"::text ILIKE $${params.push('%' + search + '%')}`);
      if (conditions.length) where = `WHERE ${conditions.join(' OR ')}`;
    }

    // Validate sort column
    const sortCol = validCols.includes(sortParam) ? sortParam : 'id';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM "${tableName}" ${where}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const offsetParam = params.push(limit);
    const limitParam = params.push(offset);
    const dataResult = await pool.query(
      `SELECT * FROM "${tableName}" ${where} ORDER BY "${sortCol}" ${order} LIMIT $${offsetParam} OFFSET $${limitParam}`,
      params,
    );

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Query table error:', error);
    res.status(500).json({ success: false, message: 'Failed to query table.' });
  }
}

// ─── Get schema (columns + types) ──────────────────────────────

export async function getSchema(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const dsResult = await pool.query('SELECT table_name FROM datasets WHERE id = $1', [id]);
    if (dsResult.rows.length === 0 || !dsResult.rows[0].table_name) {
      res.status(404).json({ success: false, message: 'Dataset or table not found.' });
      return;
    }
    const tbl = dsResult.rows[0].table_name as string;
    const cols = await pool.query(
      `SELECT column_name, data_type, udt_name
       FROM information_schema.columns
       WHERE table_name = $1
       ORDER BY ordinal_position`,
      [tbl],
    );
    res.json({ success: true, data: cols.rows });
  } catch (error) {
    console.error('Get schema error:', error);
    res.status(500).json({ success: false, message: 'Failed to get schema.' });
  }
}

// ─── Update a single row cell ───────────────────────────────────

export async function updateRow(req: Request, res: Response): Promise<void> {
  try {
    const { id, rowId } = req.params;
    const { column, value } = req.body as { column: string; value: unknown };

    const dsResult = await pool.query('SELECT table_name FROM datasets WHERE id = $1', [id]);
    if (dsResult.rows.length === 0 || !dsResult.rows[0].table_name) {
      res.status(404).json({ success: false, message: 'Dataset not found.' });
      return;
    }
    const tbl = dsResult.rows[0].table_name as string;
    if (!tbl.startsWith('dyn_')) {
      res.status(400).json({ success: false, message: 'Invalid table.' });
      return;
    }
    // Validate column exists
    const colCheck = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name=$2`,
      [tbl, column],
    );
    if (colCheck.rows.length === 0) {
      res.status(400).json({ success: false, message: 'Column not found.' });
      return;
    }
    const result = await pool.query(
      `UPDATE "${tbl}" SET "${column}" = $1 WHERE id = $2 RETURNING *`,
      [value, parseInt(rowId as string, 10)],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Row not found.' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update row error:', error);
    res.status(500).json({ success: false, message: 'Failed to update row.' });
  }
}

// ─── Insert a new row ───────────────────────────────────────────

export async function insertRow(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const rowData = req.body as Record<string, unknown>;

    const dsResult = await pool.query('SELECT table_name FROM datasets WHERE id = $1', [id]);
    if (dsResult.rows.length === 0 || !dsResult.rows[0].table_name) {
      res.status(404).json({ success: false, message: 'Dataset not found.' });
      return;
    }
    const tbl = dsResult.rows[0].table_name as string;
    if (!tbl.startsWith('dyn_')) {
      res.status(400).json({ success: false, message: 'Invalid table.' });
      return;
    }

    // Get columns (excluding id)
    const colResult = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = $1 AND column_name != 'id'
       ORDER BY ordinal_position`,
      [tbl],
    );
    const cols = colResult.rows.map((r) => r.column_name as string).filter((c) => c in rowData);
    if (cols.length === 0) {
      res.status(400).json({ success: false, message: 'No valid columns provided.' });
      return;
    }
    const values = cols.map((c) => rowData[c]);
    const colList = cols.map((c) => `"${c}"`).join(', ');
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');

    const result = await pool.query(
      `INSERT INTO "${tbl}" (${colList}) VALUES (${placeholders}) RETURNING *`,
      values,
    );

    // Update row_count in datasets
    await pool.query(`UPDATE datasets SET row_count = row_count + 1 WHERE id = $1`, [id]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Insert row error:', error);
    res.status(500).json({ success: false, message: 'Failed to insert row.' });
  }
}

// ─── Delete rows by ids ─────────────────────────────────────────

export async function deleteRows(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { ids } = req.body as { ids: number[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'ids array is required.' });
      return;
    }

    const dsResult = await pool.query('SELECT table_name FROM datasets WHERE id = $1', [id]);
    if (dsResult.rows.length === 0 || !dsResult.rows[0].table_name) {
      res.status(404).json({ success: false, message: 'Dataset not found.' });
      return;
    }
    const tbl = dsResult.rows[0].table_name as string;
    if (!tbl.startsWith('dyn_')) {
      res.status(400).json({ success: false, message: 'Invalid table.' });
      return;
    }

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(
      `DELETE FROM "${tbl}" WHERE id IN (${placeholders}) RETURNING id`,
      ids,
    );

    // Update row_count
    await pool.query(
      `UPDATE datasets SET row_count = GREATEST(row_count - $1, 0) WHERE id = $2`,
      [result.rowCount ?? 0, id],
    );

    res.json({ success: true, deleted: result.rowCount ?? 0 });
  } catch (error) {
    console.error('Delete rows error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete rows.' });
  }
}

// ─── Rename column ──────────────────────────────────────────────

export async function renameColumn(req: Request, res: Response): Promise<void> {
  try {
    const { id, colName } = req.params;
    const { newName } = req.body as { newName: string };

    if (!newName || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newName)) {
      res.status(400).json({ success: false, message: 'Invalid column name.' });
      return;
    }

    const dsResult = await pool.query('SELECT table_name, column_mapping FROM datasets WHERE id = $1', [id]);
    if (dsResult.rows.length === 0 || !dsResult.rows[0].table_name) {
      res.status(404).json({ success: false, message: 'Dataset not found.' });
      return;
    }
    const tbl = dsResult.rows[0].table_name as string;
    if (!tbl.startsWith('dyn_')) {
      res.status(400).json({ success: false, message: 'Invalid table.' });
      return;
    }

    await pool.query(`ALTER TABLE "${tbl}" RENAME COLUMN "${colName}" TO "${newName}"`);

    // Update column_mapping in datasets if present
    const mapping = dsResult.rows[0].column_mapping as Array<{ columnName: string }> | null;
    if (mapping) {
      const updated = mapping.map((m) => m.columnName === colName ? { ...m, columnName: newName } : m);
      await pool.query(`UPDATE datasets SET column_mapping = $1 WHERE id = $2`, [JSON.stringify(updated), id]);
    }

    res.json({ success: true, message: 'Column renamed.' });
  } catch (error) {
    console.error('Rename column error:', error);
    res.status(500).json({ success: false, message: 'Failed to rename column.' });
  }
}

// ─── Change column type ─────────────────────────────────────────

export async function changeColumnType(req: Request, res: Response): Promise<void> {
  try {
    const { id, colName } = req.params;
    const { newType } = req.body as { newType: string };

    const allowed = ['TEXT', 'INTEGER', 'NUMERIC', 'DATE', 'BOOLEAN'];
    if (!allowed.includes(newType?.toUpperCase())) {
      res.status(400).json({ success: false, message: 'Invalid type. Allowed: ' + allowed.join(', ') });
      return;
    }

    const dsResult = await pool.query('SELECT table_name FROM datasets WHERE id = $1', [id]);
    if (dsResult.rows.length === 0 || !dsResult.rows[0].table_name) {
      res.status(404).json({ success: false, message: 'Dataset not found.' });
      return;
    }
    const tbl = dsResult.rows[0].table_name as string;
    if (!tbl.startsWith('dyn_')) {
      res.status(400).json({ success: false, message: 'Invalid table.' });
      return;
    }

    await pool.query(
      `ALTER TABLE "${tbl}" ALTER COLUMN "${colName}" TYPE ${newType} USING "${colName}"::${newType}`,
    );

    res.json({ success: true, message: 'Column type changed.' });
  } catch (error) {
    console.error('Change column type error:', error);
    res.status(500).json({ success: false, message: 'Failed to change column type.' });
  }
}

// ─── Delete a dataset and its dynamic table ─────────────────────

export async function deleteDataset(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const dsResult = await pool.query('SELECT * FROM datasets WHERE id = $1', [id]);
    if (dsResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dataset not found.' });
      return;
    }

    const ds = dsResult.rows[0];

    // Drop the dynamic table if it exists
    if (ds.table_name) {
      await dropDynamicTable(ds.table_name);
    }

    // Delete the uploaded file
    const filePath = path.join(UPLOAD_DIR, ds.file_name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove the dataset record
    await pool.query('DELETE FROM datasets WHERE id = $1', [id]);

    res.json({ success: true, message: 'Dataset deleted.' });
  } catch (error) {
    console.error('Delete dataset error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete dataset.' });
  }
}
