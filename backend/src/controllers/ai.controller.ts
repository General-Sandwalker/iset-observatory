import { Request, Response } from 'express';
import { naturalLanguageToSQL, generateSurvey } from '../services/ai';
import pool from '../config/database';

// ─── Chat history (in-memory per session — simple approach) ──────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  data?: Record<string, unknown>[];
  rowCount?: number;
}

// We store recent conversation turns in-memory keyed by user id.
// In production you'd persist this, but for the MVP this is fine.
const chatHistories = new Map<number, ChatMessage[]>();

// ─── NL-to-SQL query ─────────────────────────────────────────────

export async function nlQuery(req: Request, res: Response): Promise<void> {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      res.status(400).json({ success: false, message: 'A question is required.' });
      return;
    }

    const result = await naturalLanguageToSQL(question.trim());

    // Persist query count to DB (fire-and-forget)
    pool.query('INSERT INTO ai_queries (user_id, question) VALUES ($1, $2)', [req.user!.id, question.trim()]).catch(() => {});

    // Store in chat history
    const userId = req.user!.id;
    if (!chatHistories.has(userId)) chatHistories.set(userId, []);
    const history = chatHistories.get(userId)!;
    history.push({ role: 'user', content: question });
    history.push({
      role: 'assistant',
      content: result.explanation,
      sql: result.sql,
      data: result.data,
      rowCount: result.rowCount,
    });
    // Keep only last 50 messages
    if (history.length > 50) history.splice(0, history.length - 50);

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('NL-to-SQL error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI query failed.',
    });
  }
}

// ─── Chat history ────────────────────────────────────────────────

export async function getChatHistory(req: Request, res: Response): Promise<void> {
  const history = chatHistories.get(req.user!.id) ?? [];
  res.json({ success: true, data: history });
}

export async function clearChatHistory(req: Request, res: Response): Promise<void> {
  chatHistories.delete(req.user!.id);
  res.json({ success: true, message: 'Chat history cleared.' });
}

// ─── List available tables for context ───────────────────────────

export async function listQueryableTables(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT id, name, table_name, row_count, column_mapping
       FROM datasets
       WHERE status = 'imported' AND table_name IS NOT NULL
       ORDER BY name`,
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List queryable tables error:', error);
    res.status(500).json({ success: false, message: 'Failed to list tables.' });
  }
}

// ─── Survey generation ───────────────────────────────────────────

export async function generateSurveyHandler(req: Request, res: Response): Promise<void> {
  try {
    const { goal, context } = req.body;

    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      res.status(400).json({ success: false, message: 'A goal description is required.' });
      return;
    }

    const survey = await generateSurvey(goal.trim(), context?.trim());

    res.json({ success: true, data: survey });
  } catch (error: any) {
    console.error('Survey generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Survey generation failed.',
    });
  }
}
