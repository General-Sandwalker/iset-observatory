import Groq from 'groq-sdk';
import { config } from '../config';
import pool from '../config/database';

// ─── Groq client singleton ───────────────────────────────────────

let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!config.groq.apiKey) {
    throw new Error('GROQ_API_KEY is not configured. Set it in your .env file.');
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey: config.groq.apiKey });
  }
  return groqClient;
}

// ─── Helpers: get dynamic-table schema for prompt context ────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Strip <think>…</think> reasoning blocks (emitted by some Groq models)
 * and markdown code fences, then return trimmed JSON text.
 */
function cleanJSON(raw: string): string {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '') // remove reasoning blocks
    .replace(/^```json?\s*/im, '')              // remove opening fence
    .replace(/\s*```$/im, '')                   // remove closing fence
    .trim();
}

/**
 * Retry wrapper for Gemini API calls with exponential backoff.
 * Handles 429 rate-limit errors automatically.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const msg = String(error?.message || error);
      const is429 = msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('quota');

      if (is429 && attempt < maxRetries) {
        // Try to extract retry delay from the error, fall back to exponential backoff
        const delayMatch = msg.match(/retry in ([\d.]+)s/i);
        const delaySec = delayMatch ? parseFloat(delayMatch[1]) : Math.pow(2, attempt + 1) * 5;
        console.log(`⏳ Rate limited — retrying in ${delaySec.toFixed(1)}s (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delaySec * 1000);
        continue;
      }

      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

async function getDynamicTablesSchema(): Promise<string> {
  // Get all datasets with their column mappings
  const result = await pool.query(
    `SELECT name, table_name, column_mapping, row_count
     FROM datasets
     WHERE status = 'imported' AND table_name IS NOT NULL
     ORDER BY name`,
  );

  if (result.rows.length === 0) {
    return 'No dynamic tables have been imported yet.';
  }

  const descriptions = result.rows.map((ds) => {
    const cols = ds.column_mapping as Array<{
      originalHeader: string;
      columnName: string;
      columnType: string;
    }>;
    const colList = cols
      .map((c) => `  - "${c.columnName}" ${c.columnType} (original: "${c.originalHeader}")`)
      .join('\n');
    return `Table "${ds.table_name}" (source: "${ds.name}", ${ds.row_count} rows):\n  Columns:\n  - "id" SERIAL PRIMARY KEY\n${colList}\n  - "_imported_at" TIMESTAMPTZ`;
  });

  return descriptions.join('\n\n');
}

// ─── NL-to-SQL ───────────────────────────────────────────────────

export interface NLQueryResult {
  question: string;
  sql: string;
  data: Record<string, unknown>[];
  rowCount: number;
  explanation: string;
  insights: string;
}

/**
 * After executing the query, send the actual results back to Groq
 * for a natural-language interpretation of what the data shows.
 */
async function generateDataInsights(
  question: string,
  sql: string,
  data: Record<string, unknown>[],
  rowCount: number,
): Promise<string> {
  if (rowCount === 0) {
    return 'The query ran successfully but returned no matching rows.';
  }

  const groq = getGroq();
  // Limit sample to 30 rows to stay within token budget
  const sample = data.slice(0, 30);

  const prompt = `You are a data analyst helping a higher-education institute (ISET Tozeur) interpret query results.

USER QUESTION: "${question}"

SQL EXECUTED:
${sql}

RESULTS (${rowCount} rows total, showing up to 30):
${JSON.stringify(sample, null, 2)}

Write a concise 2-4 sentence natural-language analysis that:
1. Directly answers the user's question using specific numbers from the data.
2. Highlights any notable patterns, extremes, or outliers.
3. Is clear and non-technical — suitable for a non-SQL audience.

Return ONLY the analysis text. Do not include SQL, markdown, or JSON.`;

  const completion = await withRetry(() =>
    groq.chat.completions.create({
      model: config.groq.model,
      messages: [{ role: 'user', content: prompt }],
    }),
  );

  const raw = completion.choices[0].message.content ?? '';
  // Strip <think>…</think> reasoning blocks emitted by some Groq models
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export async function naturalLanguageToSQL(question: string): Promise<NLQueryResult> {
  const groq = getGroq();
  const schema = await getDynamicTablesSchema();

  const prompt = `You are a PostgreSQL expert. Given the following database schema of dynamic tables, convert the user's natural language question into a READ-ONLY SQL query.

DATABASE SCHEMA:
${schema}

RULES:
1. ONLY generate SELECT queries. Never INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, or TRUNCATE.
2. Always quote table and column names with double quotes (e.g., "dyn_students"."age").
3. Return ONLY a JSON object with two keys:
   - "sql": the PostgreSQL query (string)
   - "explanation": brief human-friendly explanation of what the query does (string)
4. Do NOT include markdown code fences.
5. If the question cannot be answered with the available tables, set "sql" to "" and explain why in "explanation".
6. Limit results to 1000 rows maximum.

USER QUESTION: ${question}`;

  const completion = await withRetry(() =>
    groq.chat.completions.create({
      model: config.groq.model,
      messages: [{ role: 'user', content: prompt }],
    }),
  );
  const text = (completion.choices[0].message.content ?? '').trim();

  // Parse AI response
  let parsed: { sql: string; explanation: string };
  try {
    parsed = JSON.parse(cleanJSON(text));
  } catch {
    throw new Error(`AI returned invalid JSON: ${text.slice(0, 300)}`);
  }

  if (!parsed.sql) {
    return {
      question,
      sql: '',
      data: [],
      rowCount: 0,
      explanation: parsed.explanation || 'Could not generate a query for this question.',
      insights: parsed.explanation || 'Could not generate a query for this question.',
    };
  }

  // Safety check: only allow SELECT
  const normalised = parsed.sql.trim().toUpperCase();
  if (!normalised.startsWith('SELECT')) {
    throw new Error('AI generated a non-SELECT query. Blocked for safety.');
  }

  // Execute the query
  const queryResult = await pool.query(parsed.sql);
  const rows = queryResult.rows;

  // Generate natural-language insights from the actual results
  const insights = await generateDataInsights(question, parsed.sql, rows, rows.length);

  return {
    question,
    sql: parsed.sql,
    data: rows,
    rowCount: rows.length,
    explanation: parsed.explanation,
    insights,
  };
}

// ─── AI Survey Generator ─────────────────────────────────────────

export interface SurveyField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'radio' | 'checkbox' | 'date' | 'email' | 'rating';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];       // for select, radio, checkbox
  min?: number;             // for number, rating
  max?: number;             // for number, rating
  validation?: string;      // regex or hint
}

export interface GeneratedSurvey {
  title: string;
  description: string;
  fields: SurveyField[];
  goal: string;
}

export async function generateSurvey(goal: string, context?: string): Promise<GeneratedSurvey> {
  const groq = getGroq();

  const prompt = `You are a survey design expert for a higher education institute (ISET Tozeur, Tunisia). Generate a professional survey based on the user's goal.

GOAL: ${goal}
${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

RULES:
1. Return a JSON object with these keys:
   - "title": string (survey title)
   - "description": string (brief description for respondents)
   - "fields": array of field objects, each with:
     - "id": unique snake_case identifier (string)
     - "type": one of "text", "textarea", "number", "select", "radio", "checkbox", "date", "email", "rating"
     - "label": human-readable question label (string)
     - "placeholder": optional hint text (string)
     - "required": boolean
     - "options": array of strings (REQUIRED for select, radio, checkbox types)
     - "min": number (optional, for number/rating)
     - "max": number (optional, for number/rating)
2. Generate 5-15 relevant fields.
3. Use French labels only if the goal is in French; otherwise use English.
4. Make surveys professional, clear, and suitable for academic contexts.
5. Do NOT include markdown code fences. Return ONLY valid JSON.`;

  const completion = await withRetry(() =>
    groq.chat.completions.create({
      model: config.groq.model,
      messages: [{ role: 'user', content: prompt }],
    }),
  );
  const text = (completion.choices[0].message.content ?? '').trim();

  let parsed: Omit<GeneratedSurvey, 'goal'>;
  try {
    parsed = JSON.parse(cleanJSON(text));
  } catch {
    throw new Error(`AI returned invalid JSON: ${text.slice(0, 300)}`);
  }

  return {
    ...parsed,
    goal,
  };
}
