import { lazyEnv, z } from '@medai/config';
import { Redis } from 'ioredis';

const env = lazyEnv(
  z.object({
    REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  }),
);

let connection: Redis | null = null;

/**
 * Shared ioredis connection. `maxRetriesPerRequest: null` is required by BullMQ
 * for its blocking commands; the same client doubles as the token/cache store.
 */
export function getRedis(): Redis {
  if (!connection) {
    connection = new Redis(env().REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }
  return connection;
}

export async function closeRedis(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
