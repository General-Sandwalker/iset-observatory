import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { runMigrations } from './config/migrations';
import pool from './config/database';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import rolesRouter from './routes/roles';
import datasetsRouter from './routes/datasets';
import aiRouter from './routes/ai';
import chartsRouter from './routes/charts';
import dashboardsRouter from './routes/dashboards';
import statsRouter from './routes/stats';
import surveysRouter from './routes/surveys';
import foreignKeysRouter from './routes/foreignKeys';
import savedQueriesRouter from './routes/savedQueries';
import notificationsRouter from './routes/notifications';
import dataProfileRouter from './routes/dataProfile';
import clientsRouter from './routes/clients';
import reportsRouter from './routes/reports';

const app = express();

// --------------- Middleware ---------------
// CORS_ORIGIN may be comma-separated for multiple allowed origins
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const rawOrigin = config.cors.origin || '';
    // Normalise: trim whitespace and trailing slashes
    const allowed = rawOrigin
      .split(',')
      .map((o) => o.trim().replace(/\/+$/, ''))
      .filter(Boolean);
    // Normalise the request origin the same way
    const normalised = origin ? origin.replace(/\/+$/, '') : '';
    console.log(`[CORS] origin="${normalised}" allowed=${JSON.stringify(allowed)}`);
    // No origin = same-origin / server-to-server — always allow
    if (!normalised || normalised === 'undefined') return callback(null, true);
    if (allowed.includes('*') || allowed.includes(normalised)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------- Routes ------------------

// Public endpoints (no auth) — must be defined BEFORE authenticated routers
// because Express routers with router.use(authenticate) will intercept all /api/* requests
app.get('/api/public/dashboards', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.title, d.description, d.layout, d.created_at,
      u.full_name AS created_by_name
      FROM dashboards d
      LEFT JOIN users u ON u.id = d.created_by
      WHERE d.is_public = true
      ORDER BY d.updated_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Public dashboards error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

app.get('/api/public/dashboards/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.full_name AS created_by_name
      FROM dashboards d
      LEFT JOIN users u ON u.id = d.created_by
      WHERE d.id = $1 AND d.is_public = true`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dashboard not found or not public.' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Public dashboard error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

app.get('/api/public/dashboards/:id/charts', async (req, res) => {
  try {
    const dashResult = await pool.query(
      `SELECT layout FROM dashboards WHERE id = $1 AND is_public = true`,
      [req.params.id],
    );
    if (dashResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dashboard not found or not public.' });
      return;
    }
    const layout = dashResult.rows[0].layout;
    const chartIds: number[] = Array.isArray(layout) ? layout.map((it: any) => it.chartId) : [];
    if (chartIds.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }
    const chartsResult = await pool.query(
      `SELECT c.*, d.name AS dataset_name, d.table_name, d.column_mapping
       FROM charts c
       LEFT JOIN datasets d ON d.id = c.dataset_id
       WHERE c.id = ANY($1)
       ORDER BY c.created_at DESC`,
      [chartIds],
    );
    res.json({ success: true, data: chartsResult.rows });
  } catch (error) {
    console.error('Public dashboard charts error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

app.get('/api/public/charts/:id/data', async (req, res) => {
  try {
    const chartId = req.params.id;

    const chartCheck = await pool.query(
      `SELECT c.id FROM charts c
       JOIN dashboards d ON d.layout @> jsonb_build_array(jsonb_build_object('chartId', $1::int))
       WHERE c.id = $1 AND d.is_public = true
       LIMIT 1`,
      [chartId],
    );
    if (chartCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Chart not found or not in a public dashboard.' });
      return;
    }

    const chartResult = await pool.query(
      `SELECT c.config, d.table_name FROM charts c LEFT JOIN datasets d ON d.id = c.dataset_id WHERE c.id = $1`,
      [chartId],
    );
    if (chartResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Chart not found.' });
      return;
    }

    const { config: cfg, table_name: tableName } = chartResult.rows[0];

    if (cfg.sql) {
      const dataResult = await pool.query(cfg.sql);
      const labelCol: string = cfg.labelCol || Object.keys(dataResult.rows[0] || {})[0];
      const valueCol: string = cfg.valueCol || Object.keys(dataResult.rows[0] || {})[1];
      const labels = dataResult.rows.map((r: Record<string, unknown>) => String(r[labelCol] ?? ''));
      const values = dataResult.rows.map((r: Record<string, unknown>) => parseFloat(r[valueCol] as string) || 0);
      res.json({ success: true, data: { labels, values } });
      return;
    }

    if (!tableName || (!tableName.startsWith('dyn_') && !tableName.startsWith('data_'))) {
      res.status(400).json({ success: false, message: 'Invalid dynamic table.' });
      return;
    }

    const xCol = cfg.xColumn || cfg.xField;
    const yCol = cfg.yColumn || cfg.yField;
    const aggFn = (cfg.aggregation || 'COUNT').toUpperCase();
    const isCountOnly = !yCol || aggFn === 'COUNT' || aggFn === 'NONE';

    if (!xCol) {
      res.status(400).json({ success: false, message: 'No x column configured.' });
      return;
    }

    let sql: string;
    if (!isCountOnly && yCol) {
      sql = `SELECT "${xCol}" AS label, ${aggFn}("${yCol}") AS value FROM "${tableName}" WHERE "${xCol}" IS NOT NULL GROUP BY "${xCol}" ORDER BY value DESC LIMIT 1000`;
    } else {
      sql = `SELECT "${xCol}" AS label, COUNT(*) AS value FROM "${tableName}" WHERE "${xCol}" IS NOT NULL GROUP BY "${xCol}" ORDER BY value DESC LIMIT 1000`;
    }

    const dataResult = await pool.query(sql);
    const labels = dataResult.rows.map((r: any) => String(r.label));
    const values = dataResult.rows.map((r: any) => parseFloat(r.value));
    res.json({ success: true, data: { labels, values } });
  } catch (error) {
    console.error('Public chart data error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chart data.' });
  }
});

app.get('/api/public/surveys', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, goal, client_types, responses_count, published_at
       FROM surveys
       WHERE is_public = true AND status = 'published'
       ORDER BY published_at DESC`,
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Public surveys error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

app.get('/api/public/surveys/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, goal, schema, client_types, responses_count, published_at
       FROM surveys
       WHERE id = $1 AND is_public = true AND status = 'published'`,
      [req.params.id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Survey not found or not published.' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Public survey error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

app.post('/api/public/surveys/:id/responses', async (req, res) => {
  try {
    const surveyCheck = await pool.query(
      `SELECT id, client_types FROM surveys WHERE id = $1 AND is_public = true AND status = 'published'`,
      [req.params.id],
    );
    if (surveyCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Survey not found or not published.' });
      return;
    }
    const { answers, respondentType } = req.body;
    if (!answers || typeof answers !== 'object') {
      res.status(400).json({ success: false, message: 'answers object is required.' });
      return;
    }
    const result = await pool.query(
      `INSERT INTO survey_responses (survey_id, respondent_type, answers)
       VALUES ($1, $2, $3)
       RETURNING id, submitted_at`,
      [req.params.id, respondentType || 'anonymous', JSON.stringify(answers)],
    );
    await pool.query(
      `UPDATE surveys SET responses_count = responses_count + 1, updated_at = NOW() WHERE id = $1`,
      [req.params.id],
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Public survey response error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit response.' });
  }
});

app.get('/api/client/surveys', authenticate, async (req, res) => {
  try {
    const jwtUser = (req as any).user;
    if (jwtUser?.userType !== 'client') {
      res.status(403).json({ success: false, message: 'Only client accounts can access this endpoint.' });
      return;
    }
    const clientResult = await pool.query(
      `SELECT client_type FROM clients WHERE id = $1`,
      [jwtUser.id],
    );
    const clientType = clientResult.rows[0]?.client_type || 'student';

    const result = await pool.query(
      `SELECT id, title, description, goal, client_types, responses_count, published_at
       FROM surveys
       WHERE status = 'published'
       AND (is_public = true OR client_types @> $1::jsonb)
       ORDER BY published_at DESC`,
      [JSON.stringify([clientType])],
    );

    const clientRespResult = await pool.query(
      `SELECT survey_id FROM survey_responses WHERE client_id = $1`,
      [jwtUser.id],
    );
    const respondedIds = new Set(clientRespResult.rows.map((r: any) => r.survey_id));

    const data = result.rows.map((s: any) => ({
      ...s,
      has_responded: respondedIds.has(s.id),
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Client surveys error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

app.post('/api/client/surveys/:id/responses', authenticate, async (req, res) => {
  try {
    const jwtUser = (req as any).user;
    if (jwtUser?.userType !== 'client') {
      res.status(403).json({ success: false, message: 'Only client accounts can access this endpoint.' });
      return;
    }
    const surveyCheck = await pool.query(
      `SELECT id, client_types FROM surveys WHERE id = $1 AND status = 'published'`,
      [req.params.id],
    );
    if (surveyCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Survey not found or not published.' });
      return;
    }

    const existingResp = await pool.query(
      `SELECT id FROM survey_responses WHERE survey_id = $1 AND client_id = $2`,
      [req.params.id, jwtUser.id],
    );
    if (existingResp.rows.length > 0) {
      res.status(409).json({ success: false, message: 'You have already responded to this survey.' });
      return;
    }

    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      res.status(400).json({ success: false, message: 'answers object is required.' });
      return;
    }

    const clientResult = await pool.query(
      `SELECT client_type FROM clients WHERE id = $1`,
      [jwtUser.id],
    );
    const respondentType = clientResult.rows[0]?.client_type || 'student';

    const result = await pool.query(
      `INSERT INTO survey_responses (survey_id, client_id, respondent_type, answers)
       VALUES ($1, $2, $3, $4)
       RETURNING id, submitted_at`,
      [req.params.id, jwtUser.id, respondentType, JSON.stringify(answers)],
    );
    await pool.query(
      `UPDATE surveys SET responses_count = responses_count + 1, updated_at = NOW() WHERE id = $1`,
      [req.params.id],
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Client survey response error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit response.' });
  }
});

app.get('/api/public/reports', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.title, r.report_type, r.created_at,
      c.full_name AS client_name
      FROM reports r
      LEFT JOIN clients c ON c.id = r.client_id
      WHERE r.is_public = true
      ORDER BY r.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Public reports error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

app.get('/api/public/reports/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, c.full_name AS client_name
      FROM reports r
      LEFT JOIN clients c ON c.id = r.client_id
      WHERE r.id = $1 AND r.is_public = true`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Report not found or not public.' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Public report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

app.get('/api/client/reports', authenticate, async (req, res) => {
  try {
    const jwtUser = (req as any).user;
    if (jwtUser?.userType !== 'client') {
      res.status(403).json({ success: false, message: 'Only client accounts can access this endpoint.' });
      return;
    }
    const result = await pool.query(
      `SELECT r.*, c.full_name AS client_name, c.cin AS client_cin
      FROM reports r
      LEFT JOIN clients c ON c.id = r.client_id
      WHERE r.client_id = $1 OR r.is_public = true
      ORDER BY r.created_at DESC`,
      [jwtUser.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Client reports error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

app.get('/api/client/reports/:id', authenticate, async (req, res) => {
  try {
    const jwtUser = (req as any).user;
    if (jwtUser?.userType !== 'client') {
      res.status(403).json({ success: false, message: 'Only client accounts can access this endpoint.' });
      return;
    }
    const result = await pool.query(
      `SELECT r.*, c.full_name AS client_name, c.cin AS client_cin
      FROM reports r
      LEFT JOIN clients c ON c.id = r.client_id
      WHERE r.id = $1 AND (r.client_id = $2 OR r.is_public = true)`,
      [req.params.id, jwtUser.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Client report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Authenticated routers
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/datasets', datasetsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/charts', chartsRouter);
app.use('/api/dashboards', dashboardsRouter);
app.use('/api', statsRouter);
app.use('/api/surveys', surveysRouter);
app.use('/api', foreignKeysRouter);
app.use('/api', savedQueriesRouter);
app.use('/api', notificationsRouter);
app.use('/api', dataProfileRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/reports', reportsRouter);

// --------------- Error Handler -----------
app.use(errorHandler);

// --------------- Start -------------------
async function start() {
  // Listen first so Railway health checks pass immediately
  app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port} [${config.nodeEnv}]`);
  });
  // Run migrations after server is accepting connections
  try {
    await runMigrations();
  } catch (err) {
    console.error('❌ Migration failed (server still running):', err);
  }
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

export default app;
