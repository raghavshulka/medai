import { getRedis } from '@medai/queue';

/**
 * Server-side allowlist of valid refresh-token ids (jti -> userId), stored in
 * Redis with the same TTL as the token. Enables rotation and revocation.
 */
const key = (jti: string): string => `refresh:${jti}`;

export async function storeRefreshToken(
  jti: string,
  userId: string,
  ttlSeconds: number,
): Promise<void> {
  if (ttlSeconds <= 0) {
    return;
  }
  await getRedis().set(key(jti), userId, 'EX', ttlSeconds);
}

export async function isRefreshTokenValid(jti: string, userId: string): Promise<boolean> {
  const stored = await getRedis().get(key(jti));
  return stored === userId;
}

export async function revokeRefreshToken(jti: string): Promise<void> {
  await getRedis().del(key(jti));
}
