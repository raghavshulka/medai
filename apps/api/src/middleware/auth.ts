import { verifyAccessToken } from '@medai/auth';
import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './error';

/** Require a valid Bearer access token; populates `req.user`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    throw new HttpError(401, 'Missing authorization token');
  }
  try {
    const claims = verifyAccessToken(token);
    req.user = { id: claims.sub, role: claims.role };
    next();
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
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
