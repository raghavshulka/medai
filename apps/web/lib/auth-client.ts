import { twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth browser client. Points at the API, where the Better Auth handler
 * is mounted under /api/auth. Includes the two-factor client plugin.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:4000',
  basePath: '/api/auth',
  plugins: [twoFactorClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
