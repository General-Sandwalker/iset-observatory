import pool from '../config/database';

export interface ColumnMapping {
  originalHeader: string;
  columnName: string;       // sanitised SQL column name
  columnType: string;       // TEXT | INTEGER | NUMERIC | DATE | BOOLEAN
}

const ALLOWED_TYPES = ['TEXT', 'INTEGER', 'NUMERIC', 'DATE', 'BOOLEAN'];

/**
 * Sanitise a name so it's safe for use as a PostgreSQL identifier.
 */
function sanitiseIdentifier(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')   // replace non-alphanumeric
    .replace(/^_+|_+$/g, '')        // trim leading/trailing underscores
    .replace(/_{2,}/g, '_')         // collapse double underscores
    .slice(0, 63);                  // PG identifier limit
}

/**
 * Build and execute CREATE TABLE from a column mapping.
 * Returns the actual table name used.
 */
export async function createDynamicTable(
  tableName: string,
  columns: ColumnMapping[],
): Promise<string> {
  const safeName = `dyn_${sanitiseIdentifier(tableName)}`;

  // Validate types
  for (const col of columns) {
    if (!ALLOWED_TYPES.includes(col.columnType.toUpperCase())) {
      throw new Error(`Invalid column type: ${col.columnType}. Allowed: ${ALLOWED_TYPES.join(', ')}`);
    }
  }

  const colDefs = columns.map((c) => {
    const safeCol = sanitiseIdentifier(c.columnName);
    return `"${safeCol}" ${c.columnType.toUpperCase()}`;
  });

  const sql = `
    CREATE TABLE IF NOT EXISTS "${safeName}" (
      id SERIAL PRIMARY KEY,
      ${colDefs.join(',\n      ')},
      _imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await pool.query(sql);
  return safeName;
}

/**
 * Bulk-insert rows into a dynamic table.
 * Uses parameterised batches for safety.
 */
export async function bulkInsert(
  tableName: string,
  columns: ColumnMapping[],
  rows: Record<string, unknown>[],
): Promise<number> {
  if (rows.length === 0) return 0;

  const safeColumns = columns.map((c) => sanitiseIdentifier(c.columnName));
  const colList = safeColumns.map((c) => `"${c}"`).join(', ');

  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values: unknown[] = [];
    const rowPlaceholders: string[] = [];

    batch.forEach((row, rowIdx) => {
      const placeholders: string[] = [];
      columns.forEach((col, colIdx) => {
        const paramIdx = rowIdx * columns.length + colIdx + 1;
        placeholders.push(`$${paramIdx}`);

        let val = row[col.originalHeader] ?? null;
        // Cast to correct type
        if (val !== null) {
          switch (col.columnType.toUpperCase()) {
            case 'INTEGER':
              val = parseInt(String(val), 10);
              if (isNaN(val as number)) val = null;
              break;
            case 'NUMERIC':
              val = parseFloat(String(val));
              if (isNaN(val as number)) val = null;
              break;
            case 'BOOLEAN':
              val = ['true', '1', 'yes', 'oui'].includes(String(val).toLowerCase());
              break;
            case 'DATE':
              val = String(val);
              break;
            default:
              val = String(val);
          }
        }
        values.push(val);
      });
      rowPlaceholders.push(`(${placeholders.join(', ')})`);
    });

    const sql = `INSERT INTO "${tableName}" (${colList}) VALUES ${rowPlaceholders.join(', ')}`;
    await pool.query(sql, values);
    inserted += batch.length;
  }

  return inserted;
}

/**
 * Drop a dynamic table.
 */
export async function dropDynamicTable(tableName: string): Promise<void> {
  if (!tableName.startsWith('dyn_')) {
    throw new Error('Can only drop dynamic (dyn_*) tables.');
  }
  await pool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
}
