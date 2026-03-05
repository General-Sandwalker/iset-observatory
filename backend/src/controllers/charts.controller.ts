import { Request, Response } from 'express';
import pool from '../config/database';

// ─── Create a chart ──────────────────────────────────────────────

export async function createChart(req: Request, res: Response): Promise<void> {
  try {
    const { title, chartType, datasetId, config: chartConfig } = req.body;

    if (!title || !chartType || !datasetId) {
      res.status(400).json({ success: false, message: 'title, chartType, and datasetId are required.' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO charts (title, chart_type, dataset_id, config, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, chartType, datasetId, JSON.stringify(chartConfig || {}), req.user!.id],
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create chart error:', error);
    res.status(500).json({ success: false, message: 'Failed to create chart.' });
  }
}

// ─── List all charts ─────────────────────────────────────────────

export async function listCharts(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT c.*, d.name AS dataset_name, d.table_name, d.column_mapping
       FROM charts c
       JOIN datasets d ON d.id = c.dataset_id
       ORDER BY c.created_at DESC`,
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List charts error:', error);
    res.status(500).json({ success: false, message: 'Failed to list charts.' });
  }
}

// ─── Get single chart ────────────────────────────────────────────

export async function getChart(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT c.*, d.name AS dataset_name, d.table_name, d.column_mapping
       FROM charts c
       JOIN datasets d ON d.id = c.dataset_id
       WHERE c.id = $1`,
      [req.params.id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Chart not found.' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get chart error:', error);
    res.status(500).json({ success: false, message: 'Failed to get chart.' });
  }
}

// ─── Update chart ────────────────────────────────────────────────

export async function updateChart(req: Request, res: Response): Promise<void> {
  try {
    const { title, chartType, config: chartConfig } = req.body;
    const result = await pool.query(
      `UPDATE charts SET title = COALESCE($1, title),
                         chart_type = COALESCE($2, chart_type),
                         config = COALESCE($3, config),
                         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [title, chartType, chartConfig ? JSON.stringify(chartConfig) : null, req.params.id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Chart not found.' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update chart error:', error);
    res.status(500).json({ success: false, message: 'Failed to update chart.' });
  }
}

// ─── Delete chart ────────────────────────────────────────────────

export async function deleteChart(req: Request, res: Response): Promise<void> {
  try {
    const chartId = parseInt(req.params.id as string, 10);
    const result = await pool.query('DELETE FROM charts WHERE id = $1 RETURNING id', [chartId]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Chart not found.' });
      return;
    }

    // ── Issue #19: purge this chartId from every dashboard layout ──
    await pool.query(
      `UPDATE dashboards
       SET layout = (
         SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
         FROM   jsonb_array_elements(layout) AS elem
         WHERE  (elem->>'chartId')::int != $1
       )
       WHERE layout @> jsonb_build_array(jsonb_build_object('chartId', $1::int))`,
      [chartId],
    );

    res.json({ success: true, message: 'Chart deleted.' });
  } catch (error) {
    console.error('Delete chart error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete chart.' });
  }
}

// ─── Fetch chart data (query the dynamic table for X/Y) ─────────

export async function getChartData(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const chartResult = await pool.query(
      `SELECT c.config, d.table_name FROM charts c JOIN datasets d ON d.id = c.dataset_id WHERE c.id = $1`,
      [id],
    );
    if (chartResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Chart not found.' });
      return;
    }

    const { config: cfg, table_name: tableName } = chartResult.rows[0];

    if (!tableName || !tableName.startsWith('dyn_')) {
      res.status(400).json({ success: false, message: 'Invalid dynamic table.' });
      return;
    }

    const xCol = cfg.xColumn;
    const yCol = cfg.yColumn;
    const aggFn = cfg.aggregation || 'COUNT'; // COUNT, SUM, AVG, MIN, MAX

    if (!xCol) {
      res.status(400).json({ success: false, message: 'No x column configured.' });
      return;
    }

    let sql: string;
    let labels: string[];
    let values: number[];

    if (yCol && aggFn !== 'COUNT') {
      // Aggregate Y by X  (e.g. AVG(gpa) GROUP BY city)
      sql = `SELECT "${xCol}" AS label, ${aggFn}("${yCol}") AS value
             FROM "${tableName}"
             WHERE "${xCol}" IS NOT NULL
             GROUP BY "${xCol}"
             ORDER BY value DESC
             LIMIT 50`;
    } else {
      // COUNT by X  (e.g. COUNT(*) GROUP BY department)
      sql = `SELECT "${xCol}" AS label, COUNT(*) AS value
             FROM "${tableName}"
             WHERE "${xCol}" IS NOT NULL
             GROUP BY "${xCol}"
             ORDER BY value DESC
             LIMIT 50`;
    }

    const dataResult = await pool.query(sql);
    labels = dataResult.rows.map((r) => String(r.label));
    values = dataResult.rows.map((r) => parseFloat(r.value));

    res.json({ success: true, data: { labels, values } });
  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chart data.' });
  }
}
