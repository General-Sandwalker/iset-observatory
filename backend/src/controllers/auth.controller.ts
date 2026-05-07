import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { config } from '../config';

interface LoginBody {
  email: string;
  password: string;
}

interface ClientLoginBody {
  username: string;
  password: string;
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as LoginBody;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    // Look up user
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    const user = result.rows[0];

    if (!user.is_active) {
      res.status(403).json({ success: false, message: 'Account is disabled.' });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

  // Generate JWT
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    userType: 'staff' as const,
  };

  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      userType: 'staff',
    },
  });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function clientLogin(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body as ClientLoginBody;

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username and password are required.' });
      return;
    }

    const result = await pool.query(
      'SELECT id, cin, username, full_name, email, phone, client_type, password_hash, is_active FROM clients WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    const client = result.rows[0];

    if (!client.is_active) {
      res.status(403).json({ success: false, message: 'Account is disabled.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, client.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    const payload = {
      id: client.id,
      username: client.username,
      role: client.client_type,
      userType: 'client',
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    res.json({
      success: true,
      token,
      user: {
        id: client.id,
        email: client.email || client.username,
        fullName: client.full_name,
        role: client.client_type,
        userType: 'client',
        cin: client.cin,
      },
    });
  } catch (error) {
    console.error('Client login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const jwtUser = (req as any).user;
    const userId = jwtUser?.id;
    const userType: 'staff' | 'client' = jwtUser?.userType || 'staff';

    if (userType === 'client') {
      const result = await pool.query(
        'SELECT id, cin, username, full_name, email, client_type, is_active, created_at FROM clients WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Client not found.' });
        return;
      }

      const client = result.rows[0];

      res.json({
        success: true,
        user: {
          id: client.id,
          email: client.email || client.username,
          fullName: client.full_name,
          role: client.client_type,
          userType: 'client',
          cin: client.cin,
          username: client.username,
          isActive: client.is_active,
          createdAt: client.created_at,
          preferences: {},
        },
      });
    } else {
      const result = await pool.query(
        'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      const user = result.rows[0];

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          userType: 'staff',
          isActive: user.is_active,
          createdAt: user.created_at,
          preferences: user.preferences ?? {},
        },
      });
    }
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  try {
    const jwtUser = (req as any).user;
    const userId = jwtUser?.id;
    const userType: 'staff' | 'client' = jwtUser?.userType || 'staff';
    const { fullName, email } = req.body as { fullName?: string; email?: string };

    if (!fullName && !email) {
      res.status(400).json({ success: false, message: 'Nothing to update.' });
      return;
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (fullName) { fields.push(`full_name = $${idx++}`); values.push(fullName.trim()); }
    if (email) { fields.push(`email = $${idx++}`); values.push(email.trim().toLowerCase()); }

    values.push(userId);
    if (userType === 'client') {
      const result = await pool.query(
        `UPDATE clients SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, email, full_name, client_type`,
        values,
      );
      const u = result.rows[0];
      if (!u) {
        res.status(404).json({ success: false, message: 'Client not found.' });
        return;
      }
      res.json({
        success: true,
        user: { id: u.id, email: u.email, fullName: u.full_name, role: u.client_type, userType: 'client' },
      });
    } else {
      const result = await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, email, full_name, role`,
        values,
      );
      const u = result.rows[0];
      if (!u) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }
      res.json({
        success: true,
        user: { id: u.id, email: u.email, fullName: u.full_name, role: u.role, userType: 'staff' },
      });
    }
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({ success: false, message: 'That email is already in use.' });
      return;
    }
    console.error('UpdateMe error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const jwtUser = (req as any).user;
    const userId = jwtUser?.id;
    const userType: 'staff' | 'client' = jwtUser?.userType || 'staff';
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'currentPassword and newPassword are required.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      return;
    }

    const table = userType === 'client' ? 'clients' : 'users';
    const result = await pool.query(`SELECT password_hash FROM ${table} WHERE id = $1`, [userId]);
    if (!result.rows[0]) {
      res.status(404).json({ success: false, message: 'Not found.' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE ${table} SET password_hash = $1 WHERE id = $2`, [hashed, userId]);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('ChangePassword error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function updatePreferences(req: Request, res: Response): Promise<void> {
  try {
    const jwtUser = (req as any).user;
    const userId = jwtUser?.id;
    const userType: 'staff' | 'client' = jwtUser?.userType || 'staff';
    const { preferences } = req.body as { preferences?: Record<string, unknown> };

    if (!preferences || typeof preferences !== 'object') {
      res.status(400).json({ success: false, message: 'preferences object is required.' });
      return;
    }

    if (userType === 'client') {
      res.json({ success: true, message: 'Preferences saved.' });
      return;
    }

    await pool.query(
      `UPDATE users SET preferences = preferences || $1::jsonb WHERE id = $2`,
      [JSON.stringify(preferences), userId],
    );

    res.json({ success: true, message: 'Preferences saved.' });
  } catch (error) {
    console.error('UpdatePreferences error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
