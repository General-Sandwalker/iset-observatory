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

    // Get the table name from the dataset
    const dsResult = await pool.query('SELECT table_name FROM datasets WHERE id = $1', [id]);
    if (dsResult.rows.length === 0 || !dsResult.rows[0].table_name) {
      res.status(404).json({ success: false, message: 'Dataset or table not found.' });
      return;
    }

    const tableName = dsResult.rows[0].table_name;

    // Ensure it's a dynamic table
    if (!tableName.startsWith('dyn_')) {
      res.status(400).json({ success: false, message: 'Invalid table.' });
      return;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await pool.query(
      `SELECT * FROM "${tableName}" ORDER BY id LIMIT $1 OFFSET $2`,
      [limit, offset],
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
