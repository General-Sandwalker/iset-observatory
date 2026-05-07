import { Request, Response } from 'express';
import pool from '../config/database';
import { generateReport } from '../services/ai';

export async function listReports(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT r.id, r.title, r.report_type, r.is_public, r.client_id, r.dataset_id,
              r.created_at, r.updated_at,
              c.full_name AS client_name, c.cin AS client_cin,
              u.full_name AS created_by_name
       FROM reports r
       LEFT JOIN clients c ON c.id = r.client_id
       LEFT JOIN users u ON u.id = r.created_by
       ORDER BY r.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('listReports error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function getReport(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT r.*, c.full_name AS client_name, c.cin AS client_cin, u.full_name AS created_by_name
       FROM reports r
       LEFT JOIN clients c ON c.id = r.client_id
       LEFT JOIN users u ON u.id = r.created_by
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('getReport error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function generateReportHandler(req: Request, res: Response): Promise<void> {
  try {
    const { clientId, datasetId, title, reportType } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'Title is required.' });
      return;
    }

    let clientInfo = '';
    let clientCin: string | null = null;
    if (clientId) {
      const clientResult = await pool.query('SELECT cin, full_name, client_type FROM clients WHERE id = $1', [clientId]);
      if (clientResult.rows.length > 0) {
        const c = clientResult.rows[0];
        clientInfo = `Client: ${c.full_name} (CIN: ${c.cin}, Type: ${c.client_type})`;
        clientCin = c.cin;
      }
    }

    let dataContext = '';
    if (datasetId) {
      const dsResult = await pool.query('SELECT name, table_name, column_mapping, row_count FROM datasets WHERE id = $1', [datasetId]);
      if (dsResult.rows.length > 0) {
        const ds = dsResult.rows[0];
        const cols = ds.column_mapping as Array<{ columnName: string; columnType: string }>;
        const colList = cols.map((c) => `${c.columnName} (${c.columnType})`).join(', ');
        dataContext = `Dataset: "${ds.name}" (${ds.row_count} rows, columns: ${colList})`;

        if (clientCin) {
          try {
            const dataResult = await pool.query(
              `SELECT * FROM "${ds.table_name}" WHERE cin = $1 OR "CIN" = $1 OR Cin = $1 LIMIT 50`,
              [clientCin]
            );
            if (dataResult.rows.length > 0) {
              dataContext += `\n\nClient data rows (${dataResult.rows.length} found):\n${JSON.stringify(dataResult.rows, null, 2)}`;
            } else {
              dataContext += '\n\nNo data rows found for this client CIN in the dataset.';
            }
          } catch { dataContext += '\n\nCould not query client data from this dataset.'; }
        } else {
          try {
            const sampleResult = await pool.query(`SELECT * FROM "${ds.table_name}" LIMIT 10`);
            dataContext += `\n\nSample data (10 rows):\n${JSON.stringify(sampleResult.rows, null, 2)}`;
          } catch { dataContext += '\n\nCould not query sample data from this dataset.'; }
        }
      }
    }

    if (!clientInfo && !dataContext) {
      res.status(400).json({ success: false, message: 'Provide clientId or datasetId (or both) for context.' });
      return;
    }

    const content = await generateReport(
      reportType || 'performance',
      clientInfo,
      dataContext,
      title,
    );

    const result = await pool.query(
      `INSERT INTO reports (title, content, report_type, client_id, dataset_id, is_public, created_by)
       VALUES ($1, $2, $3, $4, $5, false, $6)
       RETURNING *`,
      [title, content, reportType || 'performance', clientId || null, datasetId || null, req.user!.id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('generateReport error:', error);
    res.status(500).json({ success: false, message: error.message || 'Report generation failed.' });
  }
}

export async function updateReport(req: Request, res: Response): Promise<void> {
  try {
    const { title, content, isPublic } = req.body;
    const result = await pool.query(
      `UPDATE reports SET title = COALESCE($1, title), content = COALESCE($2, content),
       is_public = COALESCE($3, is_public), updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [title, content, isPublic, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('updateReport error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function deleteReport(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }
    res.json({ success: true, message: 'Report deleted.' });
  } catch (error) {
    console.error('deleteReport error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function listPublicReports(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT r.id, r.title, r.report_type, r.is_public, r.created_at,
              c.full_name AS client_name
       FROM reports r
       LEFT JOIN clients c ON c.id = r.client_id
       WHERE r.is_public = true
       ORDER BY r.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('listPublicReports error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
