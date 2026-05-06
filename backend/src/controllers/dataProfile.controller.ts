import { Request, Response } from 'express';
import pool from '../config/database';

const NUMERIC_TYPES = new Set([
  'integer', 'bigint', 'smallint', 'numeric', 'decimal',
  'real', 'double precision', 'float', 'int', 'int4', 'int8',
  'float4', 'float8', 'number',
]);

export async function profileDataset(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const dsResult = await pool.query('SELECT table_name FROM datasets WHERE id = $1', [id]);
    if (dsResult.rows.length === 0 || !dsResult.rows[0].table_name) {
      res.status(404).json({ success: false, message: 'Dataset or table not found.' });
      return;
    }

    const tableName = dsResult.rows[0].table_name as string;
    if (!tableName.startsWith('dyn_')) {
      res.status(400).json({ success: false, message: 'Invalid table.' });
      return;
    }

    const colResult = await pool.query(
      `SELECT column_name, data_type, udt_name
       FROM information_schema.columns
       WHERE table_name = $1
       ORDER BY ordinal_position`,
      [tableName]
    );

    const profiles: any[] = [];

    for (const col of colResult.rows) {
      const colName = col.column_name as string;
      const dataType = col.data_type as string;
      const isNumeric = NUMERIC_TYPES.has(dataType);

      const nullResult = await pool.query(
        `SELECT COUNT(*) AS null_count FROM "${tableName}" WHERE "${colName}" IS NULL`
      );
      const nullCount = parseInt(nullResult.rows[0].null_count, 10);

      const uniqueResult = await pool.query(
        `SELECT COUNT(DISTINCT "${colName}") AS unique_count FROM "${tableName}"`
      );
      const uniqueCount = parseInt(uniqueResult.rows[0].unique_count, 10);

      const profile: any = {
        column: colName,
        dataType,
        nullCount,
        uniqueCount,
      };

      if (isNumeric) {
        const statsResult = await pool.query(
          `SELECT MIN("${colName}") AS min, MAX("${colName}") AS max, AVG("${colName}") AS avg
           FROM "${tableName}"`
        );
        profile.min = statsResult.rows[0].min;
        profile.max = statsResult.rows[0].max;
        profile.avg = statsResult.rows[0].avg ? parseFloat(statsResult.rows[0].avg) : null;
      }

      const sampleResult = await pool.query(
        `SELECT DISTINCT "${colName}" FROM "${tableName}" LIMIT 5`
      );
      profile.sampleValues = sampleResult.rows.map((r) => r[colName]);

      profiles.push(profile);
    }

    res.json({ success: true, data: profiles });
  } catch (error) {
    console.error('Profile dataset error:', error);
    res.status(500).json({ success: false, message: 'Failed to profile dataset.' });
  }
}
