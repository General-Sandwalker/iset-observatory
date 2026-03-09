import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { runMigrations } from './config/migrations';
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

const app = express();

// --------------- Middleware ---------------
// CORS_ORIGIN may be comma-separated for multiple allowed origins
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (config.cors.origin || '').split(',').map((o) => o.trim());
    if (!origin || allowed.includes('*') || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------- Routes ------------------
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
