import { getAuth } from '@medai/auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './error';

/**
 * Require a valid Better Auth session. Works with cookies or, via the bearer
 * plugin, an `Authorization: Bearer <token>` header. Populates `req.user`.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const session = await getAuth().api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    throw new HttpError(401, 'Not authenticated');
  }
  const role = (session.user as { role?: string }).role ?? 'patient';
  req.user = { id: session.user.id, role };
  next();
}

/** Require the authenticated user to hold one of the given roles. */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    if (!roles.includes(req.user.role)) {
      throw new HttpError(403, 'Insufficient permissions');
    }
    next();
  };
}
