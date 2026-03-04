import { Request, Response } from 'express';
import pool from '../config/database';

// GET /api/roles — List all roles with their permissions
export async function listRoles(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT
        r.id, r.name, r.description, r.is_system, r.created_at,
        COALESCE(
          json_agg(
            json_build_object('id', p.id, 'name', p.name, 'category', p.category)
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      GROUP BY r.id
      ORDER BY r.created_at
    `);

    res.json({ success: true, roles: result.rows });
  } catch (error) {
    console.error('listRoles error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// GET /api/roles/permissions — List all available permissions
export async function listPermissions(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT id, name, description, category FROM permissions ORDER BY category, name');
    res.json({ success: true, permissions: result.rows });
  } catch (error) {
    console.error('listPermissions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// GET /api/roles/:id — Get a single role with permissions
export async function getRole(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        r.id, r.name, r.description, r.is_system, r.created_at,
        COALESCE(
          json_agg(
            json_build_object('id', p.id, 'name', p.name, 'category', p.category, 'description', p.description)
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      WHERE r.id = $1
      GROUP BY r.id
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Role not found.' });
      return;
    }

    res.json({ success: true, role: result.rows[0] });
  } catch (error) {
    console.error('getRole error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// POST /api/roles — Create a new role
export async function createRole(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, permissionIds } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Role name is required.' });
      return;
    }

    const existing = await pool.query('SELECT id FROM roles WHERE name = $1', [name]);
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: 'Role name already exists.' });
      return;
    }

    const roleResult = await pool.query(
      'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id, name, description, is_system, created_at',
      [name, description || null]
    );

    const role = roleResult.rows[0];

    // Assign permissions
    if (Array.isArray(permissionIds) && permissionIds.length > 0) {
      const placeholders = permissionIds.map((_: number, i: number) => `($1, $${i + 2})`).join(', ');
      await pool.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
        [role.id, ...permissionIds]
      );
    }

    res.status(201).json({ success: true, role });
  } catch (error) {
    console.error('createRole error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// PUT /api/roles/:id — Update a role
export async function updateRole(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description, permissionIds } = req.body;

    const existing = await pool.query('SELECT is_system FROM roles WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Role not found.' });
      return;
    }

    // Allow editing system roles' permissions but not their name
    const isSystem = existing.rows[0].is_system;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name !== undefined && !isSystem) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE roles SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    }

    // Update permissions
    if (Array.isArray(permissionIds)) {
      await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
      if (permissionIds.length > 0) {
        const placeholders = permissionIds.map((_: number, i: number) => `($1, $${i + 2})`).join(', ');
        await pool.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
          [id, ...permissionIds]
        );
      }
    }

    res.json({ success: true, message: 'Role updated.' });
  } catch (error) {
    console.error('updateRole error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// DELETE /api/roles/:id — Delete a role
export async function deleteRole(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT is_system FROM roles WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Role not found.' });
      return;
    }

    if (existing.rows[0].is_system) {
      res.status(403).json({ success: false, message: 'Cannot delete a system role.' });
      return;
    }

    await pool.query('DELETE FROM roles WHERE id = $1', [id]);
    res.json({ success: true, message: 'Role deleted.' });
  } catch (error) {
    console.error('deleteRole error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
