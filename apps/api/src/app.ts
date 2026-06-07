import cors from 'cors';
import express, { type Express, json } from 'express';
import helmet from 'helmet';
import { corsOrigins } from './env';
import { errorHandler, notFound } from './middleware/error';
import { authRouter } from './routes/auth.routes';
import { chatRouter } from './routes/chat.routes';
import { healthRouter } from './routes/health.routes';
import './types';

/** Build the configured Express application (no network side-effects). */
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigins(), credentials: true }));
  app.use(json({ limit: '1mb' }));

  app.use('/', healthRouter);
  app.use('/auth', authRouter);
  app.use('/api', chatRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
