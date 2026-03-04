import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';

export interface ParsedFile {
  headers: string[];
  preview: Record<string, unknown>[];
  totalRows: number;
}

/**
 * Parse a CSV or Excel file and return headers + first N preview rows.
 */
export async function parseFile(filePath: string, previewRows = 20): Promise<ParsedFile> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.csv') {
    return parseCSV(filePath, previewRows);
  } else if (ext === '.xlsx' || ext === '.xls') {
    return parseExcel(filePath, previewRows);
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

// ────────────────── CSV ──────────────────

function parseCSV(filePath: string, previewRows: number): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const content = fs.readFileSync(filePath, 'utf-8');

    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? [];
        const allRows = results.data as Record<string, unknown>[];
        resolve({
          headers,
          preview: allRows.slice(0, previewRows),
          totalRows: allRows.length,
        });
      },
      error(err: Error) {
        reject(err);
      },
    });
  });
}

// ────────────────── Excel ──────────────────

async function parseExcel(filePath: string, previewRows: number): Promise<ParsedFile> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount === 0) {
    throw new Error('The Excel file has no data.');
  }

  // First row = headers
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? `Column_${colNumber}`);
  });

  const preview: Record<string, unknown>[] = [];
  const dataRowCount = sheet.rowCount - 1; // minus header

  for (let r = 2; r <= Math.min(sheet.rowCount, previewRows + 1); r++) {
    const row = sheet.getRow(r);
    const record: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      const cell = row.getCell(idx + 1);
      record[h] = cell.value;
    });
    preview.push(record);
  }

  return { headers, preview, totalRows: dataRowCount };
}

/**
 * Read ALL rows from a file (for bulk import).
 */
export async function readAllRows(filePath: string): Promise<Record<string, unknown>[]> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.csv') {
    return new Promise((resolve, reject) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete(results) {
          resolve(results.data as Record<string, unknown>[]);
        },
        error(err: Error) {
          reject(err);
        },
      });
    });
  }

  // Excel
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('No worksheet found.');

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? `Column_${colNumber}`);
  });

  const rows: Record<string, unknown>[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const record: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      const cell = row.getCell(idx + 1);
      record[h] = cell.value;
    });
    rows.push(record);
  }

  return rows;
}
