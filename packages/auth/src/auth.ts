import { dash } from '@better-auth/infra';
import { lazyEnv, z } from '@medai/config';
import { getPrisma } from '@medai/db';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer, jwt, twoFactor } from 'better-auth/plugins';

const env = lazyEnv(
  z.object({
    BETTER_AUTH_SECRET: z.string().min(16, 'BETTER_AUTH_SECRET must be at least 16 chars'),
    BETTER_AUTH_URL: z.string().default('http://localhost:4000'),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    // Better Auth Dash (hosted dashboard) API key. Enables the dash() plugin
    // and ownership verification. Optional so local dev works without it.
    BETTER_AUTH_API_KEY: z.string().optional(),
  }),
);

let instance: ReturnType<typeof createAuth> | null = null;

function createAuth() {
  const { BETTER_AUTH_SECRET, BETTER_AUTH_URL, CORS_ORIGINS, BETTER_AUTH_API_KEY } = env();
  return betterAuth({
    secret: BETTER_AUTH_SECRET,
    baseURL: BETTER_AUTH_URL,
    trustedOrigins: CORS_ORIGINS.split(',').map((o) => o.trim()),
    database: prismaAdapter(getPrisma(), { provider: 'postgresql' }),
    emailAndPassword: { enabled: true },
    user: {
      additionalFields: {
        role: { type: 'string', required: false, defaultValue: 'patient', input: false },
      },
    },
    // bearer + jwt: token-based API access (Authorization: Bearer <token>).
    // twoFactor: TOTP + backup codes.
    // dash: Better Auth hosted dashboard — exposes /api/auth/dash/* (incl.
    // /dash/validate for ownership verification). Keyed by BETTER_AUTH_API_KEY.
    plugins: [twoFactor(), bearer(), jwt(), dash({ apiKey: BETTER_AUTH_API_KEY })],
  });
}

/** Lazily-built Better Auth server instance (defers DB/env access to first use). */
export function getAuth() {
  if (!instance) {
    instance = createAuth();
  }
  return instance;
}

export type Auth = ReturnType<typeof createAuth>;
