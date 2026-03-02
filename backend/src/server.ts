import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import authRouter from './routes/auth';

const app = express();

// --------------- Middleware ---------------
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------- Routes ------------------
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);

// --------------- Error Handler -----------
app.use(errorHandler);

// --------------- Start -------------------
app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port} [${config.nodeEnv}]`);
});

export default app;
