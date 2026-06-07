import { randomUUID } from 'node:crypto';
import { lazyEnv, z } from '@medai/config';
import jwt from 'jsonwebtoken';

const env = lazyEnv(
  z.object({
    JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
    JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL: z.string().default('30d'),
  }),
);

export interface AccessTokenClaims {
  sub: string;
  role: string;
  type: 'access';
  iat?: number;
  exp?: number;
}

export interface RefreshTokenClaims {
  sub: string;
  type: 'refresh';
  tokenVersion: number;
  /** Unique token id, tracked in Redis for rotation/revocation. */
  jti: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** jti of the refresh token, for the server-side allowlist. */
  refreshJti: string;
}

export function signAccessToken(input: { sub: string; role: string }): string {
  const { JWT_ACCESS_SECRET, JWT_ACCESS_TTL } = env();
  return jwt.sign({ sub: input.sub, role: input.role, type: 'access' }, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_TTL,
  } as jwt.SignOptions);
}

export function signRefreshToken(input: { sub: string; tokenVersion: number }): {
  token: string;
  jti: string;
} {
  const { JWT_REFRESH_SECRET, JWT_REFRESH_TTL } = env();
  const jti = randomUUID();
  const token = jwt.sign(
    { sub: input.sub, type: 'refresh', tokenVersion: input.tokenVersion, jti },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_TTL } as jwt.SignOptions,
  );
  return { token, jti };
}

/** Issue a fresh access + refresh pair. */
export function issueTokenPair(input: {
  sub: string;
  role: string;
  tokenVersion: number;
}): TokenPair {
  const accessToken = signAccessToken(input);
  const { token: refreshToken, jti } = signRefreshToken(input);
  return { accessToken, refreshToken, refreshJti: jti };
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const { JWT_ACCESS_SECRET } = env();
  const claims = jwt.verify(token, JWT_ACCESS_SECRET) as AccessTokenClaims;
  if (claims.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return claims;
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
  const { JWT_REFRESH_SECRET } = env();
  const claims = jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenClaims;
  if (claims.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return claims;
}

/** Seconds remaining until a decoded JWT's `exp`, floored at 0. */
export function secondsUntilExpiry(claims: { exp?: number }): number {
  if (!claims.exp) {
    return 0;
  }
  return Math.max(0, claims.exp - Math.floor(Date.now() / 1000));
}
