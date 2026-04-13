import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requirePermission } from '../middleware/auth';
import type { GeneratedSurvey, SurveyField } from '../services/ai';

const router = Router();

type SurveyStatus = 'draft' | 'published' | 'archived';

interface SurveySummary {
  id: number;
  title: string;
  description: string | null;
  goal: string | null;
  status: SurveyStatus;
  public_token: string | null;
  public_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  question_count: number;
}

interface SurveyRecord extends SurveySummary {
  schema: GeneratedSurvey;
}

const allowedFieldTypes = new Set<SurveyField['type']>([
  'text',
  'textarea',
  'number',
  'select',
  'radio',
  'checkbox',
  'date',
  'email',
  'rating',
]);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeField(field: unknown, index: number): SurveyField {
  if (!field || typeof field !== 'object') {
    throw new Error(`Field ${index + 1} is invalid.`);
  }

  const candidate = field as Partial<SurveyField>;
  if (typeof candidate.id !== 'string' || !candidate.id.trim()) {
    throw new Error(`Field ${index + 1} is missing a valid id.`);
  }
  if (typeof candidate.label !== 'string' || !candidate.label.trim()) {
    throw new Error(`Field ${index + 1} is missing a valid label.`);
  }
  if (typeof candidate.type !== 'string' || !allowedFieldTypes.has(candidate.type as SurveyField['type'])) {
    throw new Error(`Field ${index + 1} has an unsupported type.`);
  }

  const normalized: SurveyField = {
    id: candidate.id.trim(),
    type: candidate.type as SurveyField['type'],
    label: candidate.label.trim(),
    required: Boolean(candidate.required),
  };

  if (typeof candidate.placeholder === 'string' && candidate.placeholder.trim()) {
    normalized.placeholder = candidate.placeholder.trim();
  }
  if (Array.isArray(candidate.options)) {
    normalized.options = candidate.options.map((option) => String(option).trim()).filter(Boolean);
  }
  if (typeof candidate.min === 'number') {
    normalized.min = candidate.min;
  }
  if (typeof candidate.max === 'number') {
    normalized.max = candidate.max;
  }
  if (typeof candidate.validation === 'string' && candidate.validation.trim()) {
    normalized.validation = candidate.validation.trim();
  }

  return normalized;
}

function normalizeSurveySchema(schema: unknown): GeneratedSurvey {
  if (!schema || typeof schema !== 'object') {
    throw new Error('schema must be an object');
  }

  const candidate = schema as Partial<GeneratedSurvey> & { fields?: unknown };
  if (typeof candidate.title !== 'string' || !candidate.title.trim()) {
    throw new Error('schema.title is required');
  }
  if (typeof candidate.description !== 'string') {
    throw new Error('schema.description is required');
  }
  if (typeof candidate.goal !== 'string' || !candidate.goal.trim()) {
    throw new Error('schema.goal is required');
  }
  if (!Array.isArray(candidate.fields) || candidate.fields.length === 0) {
    throw new Error('schema.fields must contain at least one field');
  }

  return {
    title: candidate.title.trim(),
    description: candidate.description.trim(),
    goal: candidate.goal.trim(),
    fields: candidate.fields.map((field, index) => normalizeField(field, index)),
  };
}

function toPublicUrl(token: string | null): string | null {
  return token ? `/api/surveys/public/${token}` : null;
}

function toSummary(row: Record<string, unknown>): SurveySummary {
  const publicToken = (row.public_token as string | null) ?? null;

  return {
    id: Number(row.id),
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    goal: (row.goal as string | null) ?? null,
    status: (row.status as SurveyStatus) ?? 'draft',
    public_token: publicToken,
    public_url: toPublicUrl(publicToken),
    published_at: (row.published_at as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    question_count: Number(row.question_count ?? 0),
  };
}

function toRecord(row: Record<string, unknown>): SurveyRecord {
  return {
    ...toSummary(row),
    schema: normalizeSurveySchema(row.schema),
  };
}

function buildHtmlSurvey(field: SurveyField, index: number): string {
  const required = field.required ? '<span class="req">*</span>' : '';
  const name = `field_${index}`;
  const label = `    <div class="field"><label for="${name}">${escapeHtml(field.label)}${required}</label>`;

  let input = '';
  switch (field.type) {
    case 'textarea':
      input = `      <textarea id="${name}" name="${name}" placeholder="${escapeHtml(field.placeholder ?? '')}"${field.required ? ' required' : ''}></textarea>`;
      break;
    case 'select':
      input =
        `      <select id="${name}" name="${name}"${field.required ? ' required' : ''}>\n` +
        `        <option value="">Select…</option>\n` +
        (field.options ?? []).map((option) => `        <option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('\n') +
        `\n      </select>`;
      break;
    case 'radio':
      input =
        `      <div class="options">` +
        (field.options ?? [])
          .map(
            (option) =>
              `\n        <label><input type="radio" name="${name}" value="${escapeHtml(option)}"${field.required ? ' required' : ''} /> ${escapeHtml(option)}</label>`,
          )
          .join('') +
        `\n      </div>`;
      break;
    case 'checkbox':
      input =
        `      <div class="options">` +
        (field.options ?? [])
          .map(
            (option) =>
              `\n        <label><input type="checkbox" name="${name}[]" value="${escapeHtml(option)}" /> ${escapeHtml(option)}</label>`,
          )
          .join('') +
        `\n      </div>`;
      break;
    case 'rating': {
      const max = field.max ?? 5;
      input =
        `      <div class="stars" id="${name}">` +
        Array.from(
          { length: max },
          (_, index) =>
            `\n        <input type="radio" name="${name}" id="${name}_${index + 1}" value="${index + 1}" /><label for="${name}_${index + 1}">★</label>`,
        ).join('') +
        `\n      </div>`;
      break;
    }
    case 'number':
      input = `      <input type="number" id="${name}" name="${name}" placeholder="${escapeHtml(field.placeholder ?? '')}"${field.min !== undefined ? ` min="${field.min}"` : ''}${field.max !== undefined ? ` max="${field.max}"` : ''}${field.required ? ' required' : ''} />`;
      break;
    default:
      input = `      <input type="${escapeHtml(field.type)}" id="${name}" name="${name}" placeholder="${escapeHtml(field.placeholder ?? '')}"${field.required ? ' required' : ''} />`;
  }

  return `${label}\n${input}\n    </div>`;
}

function buildStandaloneHtml(survey: GeneratedSurvey): string {
  const fieldsHtml = survey.fields.map(buildHtmlSurvey).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(survey.title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 680px; margin: 40px auto; padding: 0 20px;
      color: #1e293b; background: #fff; line-height: 1.6;
    }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 6px; }
    p.desc { color: #64748b; margin-bottom: 32px; font-size: 0.95rem; }
    .field { margin-bottom: 20px; }
    label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 6px; }
    label .req { color: #ef4444; margin-left: 2px; }
    input, textarea, select {
      width: 100%; padding: 8px 12px; border: 1px solid #d1d5db;
      border-radius: 6px; font-size: 0.9rem; color: #1e293b; background: #f9fafb;
      transition: border-color .15s;
    }
    input:focus, textarea:focus, select:focus { outline: none; border-color: #2563eb; background: #fff; }
    textarea { resize: vertical; min-height: 80px; }
    .options label { font-weight: 400; display: flex; align-items: center; gap: 8px; }
    .stars { display: flex; gap: 6px; }
    .stars input[type=radio] { display: none; }
    .stars label { font-size: 1.5rem; cursor: pointer; color: #d1d5db; margin: 0; }
    .submit-btn {
      display: block; width: 100%; padding: 12px;
      background: #2563eb; color: #fff; border: none; border-radius: 8px;
      font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 32px;
      transition: background .15s;
    }
    .submit-btn:hover { background: #1d4ed8; }
    footer { margin-top: 48px; text-align: center; font-size: 0.75rem; color: #94a3b8; }
    @media print { body { margin: 0; } .submit-btn { display: none; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(survey.title)}</h1>
  ${survey.description ? `<p class="desc">${escapeHtml(survey.description)}</p>` : ''}
  <form>
${fieldsHtml}
    <button type="submit" class="submit-btn">Submit</button>
  </form>
  <footer>Generated by ISET Observatory · Survey Manager</footer>
</body>
</html>`;
}

router.get('/public/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, goal, schema, status, public_token, published_at, created_at, updated_at,
              jsonb_array_length(COALESCE(schema->'fields', '[]'::jsonb)) AS question_count
       FROM surveys
       WHERE public_token = $1 AND status = 'published'`,
      [req.params.token],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Survey not found' });
      return;
    }

    res.json({ success: true, data: toRecord(result.rows[0]) });
  } catch (error) {
    console.error('GET /api/surveys/public/:token error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch survey' });
  }
});

router.use(authenticate);

router.get('/', requirePermission('surveys.view'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, goal, status, public_token, published_at, created_at, updated_at,
              jsonb_array_length(COALESCE(schema->'fields', '[]'::jsonb)) AS question_count
       FROM surveys
       WHERE user_id = $1
       ORDER BY updated_at DESC, created_at DESC`,
      [req.user!.id],
    );

    res.json({ success: true, data: result.rows.map((row) => toSummary(row)) });
  } catch (error) {
    console.error('GET /api/surveys error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch surveys' });
  }
});

router.post('/', requirePermission('surveys.create'), async (req: Request, res: Response): Promise<void> => {
  const { title, description, goal, schema } = req.body as {
    title: string;
    description?: string;
    goal?: string;
    schema: unknown;
  };

  if (!title || !schema) {
    res.status(400).json({ success: false, message: 'title and schema are required' });
    return;
  }

  try {
    const normalizedSchema = normalizeSurveySchema(schema);
    const result = await pool.query(
      `INSERT INTO surveys (user_id, title, description, goal, schema, status)
       VALUES ($1, $2, $3, $4, $5, 'draft')
       RETURNING id, title, description, goal, status, public_token, published_at, created_at, updated_at,
                 jsonb_array_length(COALESCE(schema->'fields', '[]'::jsonb)) AS question_count`,
      [req.user!.id, title, description ?? null, goal ?? normalizedSchema.goal, JSON.stringify(normalizedSchema)],
    );

    res.status(201).json({ success: true, data: toSummary(result.rows[0]) });
  } catch (error) {
    console.error('POST /api/surveys error:', error);
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to save survey' });
  }
});

router.get('/:id/export/html', requirePermission('surveys.view'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT title, description, schema FROM surveys WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Survey not found' });
      return;
    }

    const row = result.rows[0] as { title: string; description: string | null; schema: GeneratedSurvey };
    const html = buildStandaloneHtml(normalizeSurveySchema(row.schema));

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${row.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html"`);
    res.send(html);
  } catch (error) {
    console.error('HTML export error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

router.get('/:id', requirePermission('surveys.view'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, goal, schema, status, public_token, published_at, created_at, updated_at,
              jsonb_array_length(COALESCE(schema->'fields', '[]'::jsonb)) AS question_count
       FROM surveys
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Survey not found' });
      return;
    }

    res.json({ success: true, data: toRecord(result.rows[0]) });
  } catch (error) {
    console.error('GET /api/surveys/:id error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch survey' });
  }
});

router.patch('/:id', requirePermission('surveys.manage'), async (req: Request, res: Response): Promise<void> => {
  const { title, description, goal, schema } = req.body as {
    title?: string;
    description?: string | null;
    goal?: string | null;
    schema?: unknown;
  };

  if (title === undefined && description === undefined && goal === undefined && schema === undefined) {
    res.status(400).json({ success: false, message: 'No survey fields were provided' });
    return;
  }

  try {
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (title !== undefined) {
      fields.push(`title = $${index++}`);
      values.push(title);
    }
    if (description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(description);
    }
    if (goal !== undefined) {
      fields.push(`goal = $${index++}`);
      values.push(goal);
    }
    if (schema !== undefined) {
      const normalizedSchema = normalizeSurveySchema(schema);
      fields.push(`schema = $${index++}`);
      values.push(JSON.stringify(normalizedSchema));
    }

    fields.push('updated_at = NOW()');
    values.push(req.params.id, req.user!.id);

    const result = await pool.query(
      `UPDATE surveys
       SET ${fields.join(', ')}
       WHERE id = $${index++} AND user_id = $${index}
       RETURNING id, title, description, goal, status, public_token, published_at, created_at, updated_at,
                 jsonb_array_length(COALESCE(schema->'fields', '[]'::jsonb)) AS question_count`,
      values,
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Survey not found' });
      return;
    }

    res.json({ success: true, data: toSummary(result.rows[0]) });
  } catch (error) {
    console.error('PATCH /api/surveys/:id error:', error);
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to update survey' });
  }
});

router.post('/:id/publish', requirePermission('surveys.manage'), async (req: Request, res: Response): Promise<void> => {
  try {
    const current = await pool.query(
      `SELECT public_token FROM surveys WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id],
    );

    if (current.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Survey not found' });
      return;
    }

    const publicToken = current.rows[0].public_token ?? crypto.randomBytes(16).toString('hex');
    const result = await pool.query(
      `UPDATE surveys
       SET status = 'published',
           public_token = $1,
           published_at = COALESCE(published_at, NOW()),
           updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, title, description, goal, status, public_token, published_at, created_at, updated_at,
                 jsonb_array_length(COALESCE(schema->'fields', '[]'::jsonb)) AS question_count`,
      [publicToken, req.params.id, req.user!.id],
    );

    res.json({ success: true, data: toSummary(result.rows[0]) });
  } catch (error) {
    console.error('POST /api/surveys/:id/publish error:', error);
    res.status(500).json({ success: false, message: 'Failed to publish survey' });
  }
});

router.post('/:id/archive', requirePermission('surveys.manage'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `UPDATE surveys
       SET status = 'archived',
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, description, goal, status, public_token, published_at, created_at, updated_at,
                 jsonb_array_length(COALESCE(schema->'fields', '[]'::jsonb)) AS question_count`,
      [req.params.id, req.user!.id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Survey not found' });
      return;
    }

    res.json({ success: true, data: toSummary(result.rows[0]) });
  } catch (error) {
    console.error('POST /api/surveys/:id/archive error:', error);
    res.status(500).json({ success: false, message: 'Failed to archive survey' });
  }
});

router.delete('/:id', requirePermission('surveys.manage'), async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('DELETE /api/surveys error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete survey' });
  }
});

export default router;