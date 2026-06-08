import { getAuth } from '@medai/auth';
import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express, { type Express, json } from 'express';
import helmet from 'helmet';
import { corsOrigins } from './env';
import { errorHandler, notFound } from './middleware/error';
import { chatRouter } from './routes/chat.routes';
import { healthRouter } from './routes/health.routes';
import './types';

/** Build the configured Express application (no network side-effects). */
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigins(), credentials: true }));

  // Better Auth owns everything under /api/auth/*. It reads the raw request
  // body itself, so it MUST be mounted before express.json().
  app.all('/api/auth/*splat', toNodeHandler(getAuth()));

  app.use(json({ limit: '1mb' }));

  app.use('/', healthRouter);
  app.use('/api', chatRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
