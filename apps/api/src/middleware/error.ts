import { createLogger } from '@medai/logger';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

const log = createLogger('api:error');

/** Throwable error carrying an HTTP status code. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** 404 handler for unmatched routes. */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

/**
 * Central error handler. Express 5 forwards rejected async handlers here
 * automatically, so route handlers can simply `throw`.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: 'Validation failed', issues: err.issues });
    return;
  }
  if (err instanceof HttpError) {
    if (err.status >= 500) {
      log.error({ err }, err.message);
    }
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  log.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
}
