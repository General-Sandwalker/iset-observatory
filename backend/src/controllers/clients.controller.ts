import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Papa from 'papaparse';
import pool from '../config/database';

export async function listClients(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT c.id, c.cin, c.username, c.full_name, c.email, c.phone,
              c.client_type, c.is_active, c.created_at, c.updated_at,
              u.full_name AS created_by_name
       FROM clients c
       LEFT JOIN users u ON u.id = c.created_by
       ORDER BY c.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('listClients error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function getClient(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT c.*, u.full_name AS created_by_name
       FROM clients c
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Client not found.' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('getClient error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function createClient(req: Request, res: Response): Promise<void> {
  try {
    const { cin, username, fullName, email, phone, clientType, password } = req.body;

    if (!cin || !username || !fullName) {
      res.status(400).json({ success: false, message: 'CIN, username, and full name are required.' });
      return;
    }

    const type = clientType || 'student';
    if (!['student', 'alumni', 'teacher'].includes(type)) {
      res.status(400).json({ success: false, message: 'clientType must be student, alumni, or teacher.' });
      return;
    }

    const cinCheck = await pool.query('SELECT id FROM clients WHERE cin = $1', [cin]);
    if (cinCheck.rows.length > 0) {
      res.status(409).json({ success: false, message: 'CIN already exists.' });
      return;
    }

    const usernameCheck = await pool.query('SELECT id FROM clients WHERE username = $1', [username]);
    if (usernameCheck.rows.length > 0) {
      res.status(409).json({ success: false, message: 'Username already exists.' });
      return;
    }

    const passwordToUse = password || cin;
    const passwordHash = await bcrypt.hash(String(passwordToUse), 10);

    const result = await pool.query(
      `INSERT INTO clients (cin, username, full_name, email, phone, client_type, password_hash, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, cin, username, full_name, email, phone, client_type, is_active, created_at`,
      [cin, username, fullName, email || null, phone || null, type, passwordHash, req.user!.id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('createClient error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function updateClient(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { cin, username, fullName, email, phone, clientType, isActive, password } = req.body;

    const existing = await pool.query('SELECT id FROM clients WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Client not found.' });
      return;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (cin !== undefined) { fields.push(`cin = $${idx++}`); values.push(cin); }
    if (username !== undefined) { fields.push(`username = $${idx++}`); values.push(username); }
    if (fullName !== undefined) { fields.push(`full_name = $${idx++}`); values.push(fullName); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
    if (clientType !== undefined) { fields.push(`client_type = $${idx++}`); values.push(clientType); }
    if (isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(isActive); }
    if (password) {
      const hash = await bcrypt.hash(String(password), 10);
      fields.push(`password_hash = $${idx++}`);
      values.push(hash);
    }

    if (fields.length > 0) {
      fields.push(`updated_at = NOW()`);
      values.push(id);
      await pool.query(`UPDATE clients SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    }

    const updated = await pool.query('SELECT id, cin, username, full_name, email, phone, client_type, is_active, created_at, updated_at FROM clients WHERE id = $1', [id]);
    res.json({ success: true, data: updated.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({ success: false, message: 'CIN or username already exists.' });
      return;
    }
    console.error('updateClient error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function deleteClient(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Client not found.' });
      return;
    }
    res.json({ success: true, message: 'Client deleted.' });
  } catch (error) {
    console.error('deleteClient error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function bulkImportClients(req: Request, res: Response): Promise<void> {
  try {
    const { rows, columnMapping, passwordColumn } = req.body as {
      rows: Record<string, string>[];
      columnMapping: { cin: string; username: string; fullName: string; email?: string; phone?: string; clientType?: string };
      passwordColumn?: string;
    };

    if (!rows || !rows.length || !columnMapping) {
      res.status(400).json({ success: false, message: 'rows and columnMapping are required.' });
      return;
    }

    const { cin: cinCol, username: usernameCol, fullName: nameCol, email: emailCol, phone: phoneCol, clientType: typeCol } = columnMapping;

    if (!cinCol || !usernameCol || !nameCol) {
      res.status(400).json({ success: false, message: 'columnMapping must map cin, username, and fullName.' });
      return;
    }

    const created: any[] = [];
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cin = String(row[cinCol] || '').trim();
      const username = String(row[usernameCol] || '').trim();
      const fullName = String(row[nameCol] || '').trim();

      if (!cin || !username || !fullName) {
        errors.push({ row: i + 1, message: 'Missing required fields (CIN, username, or full name).' });
        continue;
      }

      const email = emailCol ? String(row[emailCol] || '').trim() || null : null;
      const phone = phoneCol ? String(row[phoneCol] || '').trim() || null : null;
      const clientType = typeCol ? String(row[typeCol] || 'student').trim() : 'student';

      if (!['student', 'alumni', 'teacher'].includes(clientType)) {
        errors.push({ row: i + 1, message: `Invalid clientType "${clientType}". Must be student, alumni, or teacher.` });
        continue;
      }

      const passwordValue = passwordColumn ? String(row[passwordColumn] || '').trim() : cin;
      if (!passwordValue) {
        errors.push({ row: i + 1, message: 'No password value found (password column or CIN fallback is empty).' });
        continue;
      }

      try {
        const hash = await bcrypt.hash(passwordValue, 10);
        const result = await pool.query(
          `INSERT INTO clients (cin, username, full_name, email, phone, client_type, password_hash, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (cin) DO NOTHING
           RETURNING id, cin, username, full_name, client_type`,
          [cin, username, fullName, email, phone, clientType, hash, req.user!.id]
        );
        if (result.rows.length > 0) {
          created.push(result.rows[0]);
        } else {
          errors.push({ row: i + 1, message: `CIN "${cin}" already exists (skipped).` });
        }
      } catch (err: any) {
        if (err.code === '23505') {
          errors.push({ row: i + 1, message: `Username "${username}" already exists (skipped).` });
        } else {
          errors.push({ row: i + 1, message: String(err.message || 'Unknown error') });
        }
      }
    }

    res.json({
      success: true,
      created: created.length,
      skipped: errors.length,
      total: rows.length,
      errors: errors.slice(0, 50),
      data: created,
    });
  } catch (error) {
    console.error('bulkImportClients error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
