import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

interface SurveyField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildFieldHtml(field: SurveyField, index: number): string {
  const req = field.required ? '<span class="req">*</span>' : '';
  const name = `field_${index}`;
  const label = ` <div class="field">
  <label for="${name}">${escapeHtml(field.label)}${req}</label>`;
  let input = '';
  switch (field.type) {
    case 'textarea':
      input = ` <textarea id="${name}" name="${name}" placeholder="${escapeHtml(field.placeholder ?? '')}"${field.required ? ' required' : ''}></textarea>`;
      break;
    case 'select':
      input =
        ` <select id="${name}" name="${name}"${field.required ? ' required' : ''}>\n` +
        ` <option value="">Select…</option>\n` +
        (field.options ?? []).map((o) => ` <option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('\n') +
        `\n </select>`;
      break;
    case 'radio':
      input =
        ` <div class="options">` +
        (field.options ?? [])
          .map(
            (o) =>
              `\n <label><input type="radio" name="${name}" value="${escapeHtml(o)}"${field.required ? ' required' : ''} /> ${escapeHtml(o)}</label>`,
          )
          .join('') +
        `\n </div>`;
      break;
    case 'checkbox':
      input =
        ` <div class="options">` +
        (field.options ?? [])
          .map(
            (o) =>
              `\n <label><input type="checkbox" name="${name}[]" value="${escapeHtml(o)}" /> ${escapeHtml(o)}</label>`,
          )
          .join('') +
        `\n </div>`;
      break;
    case 'rating': {
      const max = field.max ?? 5;
      input =
        ` <div class="stars" id="${name}">` +
        Array.from(
          { length: max },
          (_, i) =>
            `\n <input type="radio" name="${name}" id="${name}_${i + 1}" value="${i + 1}" /><label for="${name}_${i + 1}">★</label>`,
        ).join('') +
        `\n </div>`;
      break;
    }
    case 'number':
      input = ` <input type="number" id="${name}" name="${name}" placeholder="${escapeHtml(field.placeholder ?? '')}"${field.min !== undefined ? ` min="${field.min}"` : ''}${field.max !== undefined ? ` max="${field.max}"` : ''}${field.required ? ' required' : ''} />`;
      break;
    default:
      input = ` <input type="${escapeHtml(field.type)}" id="${name}" name="${name}" placeholder="${escapeHtml(field.placeholder ?? '')}"${field.required ? ' required' : ''} />`;
  }
  return `${label}\n${input}\n </div>`;
}

// ─── GET /api/surveys ─ list all surveys (with status/is_public) ─────────
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, goal, is_public, status, client_types, responses_count, published_at, created_at, updated_at
       FROM surveys
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user!.id],
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /api/surveys error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch surveys' });
  }
});

// ─── GET /api/surveys/:id ─ get single survey with full schema ───────────
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, goal, schema, is_public, status, client_types, responses_count, published_at, created_at, updated_at
       FROM surveys
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Survey not found' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('GET /api/surveys/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch survey' });
  }
});

// ─── POST /api/surveys ─ save a generated survey (as draft by default) ───
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { title, description, goal, schema, isPublic, clientTypes } = req.body as {
    title: string;
    description?: string;
    goal?: string;
    schema: object;
    isPublic?: boolean;
    clientTypes?: string[];
  };

  if (!title || !schema) {
    res.status(400).json({ success: false, message: 'title and schema are required' });
    return;
  }

  const status = isPublic ? 'published' : 'draft';
  const publishedAt = isPublic ? 'NOW()' : 'NULL';

  try {
    const result = await pool.query(
      `INSERT INTO surveys (user_id, title, description, goal, schema, is_public, status, client_types, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${isPublic ? 'NOW()' : 'NULL'})
       RETURNING id, title, description, goal, is_public, status, client_types, responses_count, published_at, created_at, updated_at`,
      [
        req.user!.id,
        title,
        description ?? null,
        goal ?? null,
        JSON.stringify(schema),
        isPublic ?? false,
        status,
        JSON.stringify(clientTypes ?? []),
      ],
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('POST /api/surveys error:', err);
    res.status(500).json({ success: false, message: 'Failed to save survey' });
  }
});

// ─── PUT /api/surveys/:id ─ update a saved survey (title, schema, etc.) ──
router.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { title, description, goal, schema, isPublic, clientTypes } = req.body as {
    title?: string;
    description?: string;
    goal?: string;
    schema?: object;
    isPublic?: boolean;
    clientTypes?: string[];
  };

  try {
    const existing = await pool.query(
      `SELECT status FROM surveys WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id],
    );
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Survey not found' });
      return;
    }

    const newStatus = isPublic ? 'published' : 'draft';
    const wasDraft = existing.rows[0].status === 'draft';
    const shouldSetPublishedAt = isPublic && wasDraft;

    const result = await pool.query(
      `UPDATE surveys SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         goal = COALESCE($3, goal),
         schema = COALESCE($4, schema),
         is_public = COALESCE($5, is_public),
         status = COALESCE($6, status),
         client_types = COALESCE($7, client_types),
         published_at = CASE WHEN $8 THEN NOW() ELSE published_at END,
         updated_at = NOW()
       WHERE id = $9 AND user_id = $10
       RETURNING id, title, description, goal, is_public, status, client_types, responses_count, published_at, created_at, updated_at`,
      [
        title ?? null,
        description ?? null,
        goal ?? null,
        schema ? JSON.stringify(schema) : null,
        isPublic ?? null,
        newStatus,
        clientTypes ? JSON.stringify(clientTypes) : null,
        shouldSetPublishedAt,
        req.params.id,
        req.user!.id,
      ],
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('PUT /api/surveys error:', err);
    res.status(500).json({ success: false, message: 'Failed to update survey' });
  }
});

// ─── DELETE /api/surveys/:id ─ remove a saved survey ─────────────────────
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `DELETE FROM surveys WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user!.id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Survey not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/surveys error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete survey' });
  }
});

// ─── GET /api/surveys/:id/responses ─ list responses for a survey ────────
router.get('/:id/responses', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const surveyCheck = await pool.query(
      `SELECT id FROM surveys WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id],
    );
    if (surveyCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Survey not found' });
      return;
    }

    const result = await pool.query(
      `SELECT sr.id, sr.survey_id, sr.respondent_type, sr.answers, sr.submitted_at,
              c.full_name AS respondent_name, c.cin AS respondent_cin
       FROM survey_responses sr
       LEFT JOIN clients c ON c.id = sr.client_id
       WHERE sr.survey_id = $1
       ORDER BY sr.submitted_at DESC`,
      [req.params.id],
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /api/surveys/:id/responses error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch responses' });
  }
});

// ─── GET /api/surveys/:id/export/html ─ standalone HTML form ─────────────
router.get('/:id/export/html', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT title, description, schema FROM surveys WHERE id = $1 AND user_id = $2`,
      [id, req.user!.id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Survey not found' });
      return;
    }

    const { title, description, schema } = result.rows[0] as {
      title: string;
      description: string;
      schema: { fields: SurveyField[] };
    };

    const fieldsHtml = (schema.fields ?? []).map((field, i) => buildFieldHtml(field, i)).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<style>
*, *::before, *::after { box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 680px; margin: 40px auto; padding: 0 20px; color: #1e293b; background: #fff; line-height: 1.6; }
h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 6px; }
p.desc { color: #64748b; margin-bottom: 32px; font-size: 0.95rem; }
.field { margin-bottom: 20px; }
label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 6px; }
label .req { color: #ef4444; margin-left: 2px; }
input, textarea, select { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; color: #1e293b; background: #f9fafb; transition: border-color .15s; }
input:focus, textarea:focus, select:focus { outline: none; border-color: #2563eb; background: #fff; }
textarea { resize: vertical; min-height: 80px; }
.options label { font-weight: 400; display: flex; align-items: center; gap: 8px; }
.stars { display: flex; gap: 6px; }
.stars input[type=radio] { display: none; }
.stars label { font-size: 1.5rem; cursor: pointer; color: #d1d5db; margin: 0; }
.submit-btn { display: block; width: 100%; padding: 12px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 32px; transition: background .15s; }
.submit-btn:hover { background: #1d4ed8; }
footer { margin-top: 48px; text-align: center; font-size: 0.75rem; color: #94a3b8; }
@media print { body { margin: 0; } .submit-btn { display: none; } }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
${description ? `<p class="desc">${escapeHtml(description)}</p>` : ''}
<form>
${fieldsHtml}
<button type="submit" class="submit-btn">Submit</button>
</form>
<footer>Generated by ISET Observatory · Survey Generator</footer>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html"`,
    );
    res.send(html);
  } catch (err) {
    console.error('HTML export error:', err);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

export default router;
