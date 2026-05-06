import { Request, Response } from 'express';
import pool from '../config/database';

export async function listNotifications(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user!.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to list notifications.' });
  }
}

export async function createNotification(req: Request, res: Response): Promise<void> {
  try {
    const { userId, type, title, message } = req.body;

    if (!title || !message) {
      res.status(400).json({ success: false, message: 'title and message are required.' });
      return;
    }

    if (!userId) {
      res.status(400).json({ success: false, message: 'userId is required.' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, type || 'info', title, message]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to create notification.' });
  }
}

export async function markRead(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read.' });
  }
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [req.user!.id]
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read.' });
  }
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (req.user!.role === 'super_admin') {
      const result = await pool.query('DELETE FROM notifications WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Notification not found.' });
        return;
      }
      res.json({ success: true, message: 'Notification deleted.' });
      return;
    }

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification.' });
  }
}
