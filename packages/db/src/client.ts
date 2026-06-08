import { lazyEnv, z } from '@medai/config';
import { createLogger } from '@medai/logger';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const log = createLogger('db');

const env = lazyEnv(
  z.object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  }),
);

let client: PrismaClient | null = null;

/**
 * Lazily-constructed Prisma client (Postgres via the pg driver adapter — no
 * Rust engine, Bun-friendly). Construction is deferred so that *importing*
 * `@medai/db` never reads env or opens a connection; callers that must stay up
 * (the API) connect explicitly and tolerate failure.
 */
export function getPrisma(): PrismaClient {
  if (!client) {
    const adapter = new PrismaPg(env().DATABASE_URL);
    client = new PrismaClient({ adapter });
  }
  return client;
}

/** Open a connection eagerly (optional — queries connect on demand otherwise). */
export async function connectDb(): Promise<void> {
  await getPrisma().$connect();
  log.info('PostgreSQL connected');
}

/** Close the connection (used on shutdown / in tests). */
export async function disconnectDb(): Promise<void> {
  if (client) {
    await client.$disconnect();
    client = null;
    log.info('PostgreSQL disconnected');
  }
}

/** Lightweight liveness probe for health checks. */
export async function isDbHealthy(): Promise<boolean> {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
