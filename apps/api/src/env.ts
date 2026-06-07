import { lazyEnv, nodeEnvSchema, z } from '@medai/config';

/**
 * Server-level config only. Secrets (JWT, AI keys) and `MONGODB_URI` are
 * validated lazily by their owning packages, so the API can boot and serve
 * health checks even if those are unset / the database is unreachable.
 */
export const env = lazyEnv(
  z.object({
    NODE_ENV: nodeEnvSchema,
    API_PORT: z.coerce.number().int().positive().default(4000),
    API_HOST: z.string().default('0.0.0.0'),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
  }),
);

/** Parse the comma-separated CORS_ORIGINS into an array. */
export function corsOrigins(): string[] {
  return env()
    .CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
