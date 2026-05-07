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
