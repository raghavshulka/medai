import './load-env';
import { connectDb, disconnectDb } from '@medai/db';
import { createLogger } from '@medai/logger';
import { closeRedis } from '@medai/queue';
import { createApp } from './app';
import { env } from './env';

const log = createLogger('api');

function main(): void {
  const { API_PORT, API_HOST } = env();
  const app = createApp();

  const server = app.listen(API_PORT, API_HOST, () => {
    log.info(`API listening on http://${API_HOST}:${API_PORT}`);
  });

  // Connect to Postgres in the background — the server stays up even if the
  // database is unreachable (health checks report it as disconnected).
  connectDb().catch((err: unknown) => {
    log.warn(
      { err: err instanceof Error ? err.message : String(err) },
      'PostgreSQL unavailable at startup; continuing in degraded mode',
    );
  });

  const shutdown = (signal: string) => {
    log.info(`${signal} received, shutting down`);
    server.close(() => {
      void Promise.allSettled([disconnectDb(), closeRedis()]).then(() => process.exit(0));
    });
    // Force-exit if graceful shutdown stalls.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
