import { isDbHealthy } from '@medai/db';
import { Router } from 'express';

export const healthRouter: Router = Router();

healthRouter.get('/health', async (_req, res) => {
  const db = (await isDbHealthy()) ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    db,
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/ready', (_req, res) => {
  // Ready to serve once the process is up; DB is optional/degradable here.
  res.json({ ready: true });
});
