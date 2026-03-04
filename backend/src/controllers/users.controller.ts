import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';

// GET /api/users — List all users with their roles
export async function listUsers(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT
        u.id, u.email, u.full_name, u.role AS legacy_role,
        u.is_active, u.created_at, u.updated_at,
        COALESCE(
          json_agg(
            json_build_object('id', r.id, 'name', r.name)
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('listUsers error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// GET /api/users/:id — Get single user with roles & permissions
export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const userResult = await pool.query(`
      SELECT
        u.id, u.email, u.full_name, u.role AS legacy_role,
        u.is_active, u.created_at, u.updated_at,
        COALESCE(
          json_agg(
            json_build_object('id', r.id, 'name', r.name)
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [id]);

    if (userResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({ success: true, user: userResult.rows[0] });
  } catch (error) {
    console.error('getUser error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// POST /api/users — Create a new user
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, fullName, roleIds } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ success: false, message: 'Email, password, and full name are required.' });
      return;
    }

    // Check duplicate email
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: 'Email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Determine legacy role from assigned roles
    let legacyRole = 'viewer';
    if (Array.isArray(roleIds) && roleIds.length > 0) {
      const roleResult = await pool.query('SELECT name FROM roles WHERE id = $1', [roleIds[0]]);
      if (roleResult.rows.length > 0) legacyRole = roleResult.rows[0].name;
    }

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role, is_active, created_at`,
      [email, passwordHash, fullName, legacyRole]
    );

    const user = userResult.rows[0];

    // Assign roles
    if (Array.isArray(roleIds) && roleIds.length > 0) {
      const values = roleIds.map((_: number, i: number) => `($1, $${i + 2})`).join(', ');
      await pool.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ${values} ON CONFLICT DO NOTHING`,
        [user.id, ...roleIds]
      );
    }

    res.status(201).json({ success: true, user });
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// PUT /api/users/:id — Update a user
export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { email, fullName, password, isActive, roleIds } = req.body;

    // Prevent editing super_admin if you're not super_admin
    const targetUser = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (targetUser.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (targetUser.rows[0].role === 'super_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Cannot modify the super admin.' });
      return;
    }

    // Build dynamic update
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(email);
    }
    if (fullName !== undefined) {
      fields.push(`full_name = $${idx++}`);
      values.push(fullName);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      fields.push(`password_hash = $${idx++}`);
      values.push(hash);
    }
    if (isActive !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(isActive);
    }

    // Update legacy role from assigned roles
    if (Array.isArray(roleIds) && roleIds.length > 0) {
      const roleResult = await pool.query('SELECT name FROM roles WHERE id = $1', [roleIds[0]]);
      if (roleResult.rows.length > 0) {
        fields.push(`role = $${idx++}`);
        values.push(roleResult.rows[0].name);
      }
    }

    if (fields.length > 0) {
      fields.push(`updated_at = NOW()`);
      values.push(id);
      await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    // Update role assignments
    if (Array.isArray(roleIds)) {
      await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
      if (roleIds.length > 0) {
        const rolePlaceholders = roleIds.map((_: number, i: number) => `($1, $${i + 2})`).join(', ');
        await pool.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ${rolePlaceholders} ON CONFLICT DO NOTHING`,
          [id, ...roleIds]
        );
      }
    }

    // Return updated user
    const updated = await pool.query(
      `SELECT id, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = $1`,
      [id]
    );

    res.json({ success: true, user: updated.rows[0] });
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// DELETE /api/users/:id — Delete a user
export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Prevent deleting super_admin
    const targetUser = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (targetUser.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    if (targetUser.rows[0].role === 'super_admin') {
      res.status(403).json({ success: false, message: 'Cannot delete the super admin.' });
      return;
    }

    // Prevent self-deletion
    if (parseInt(id) === req.user?.id) {
      res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
      return;
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true, message: 'User deleted.' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
