/** Express request augmentation: `req.user` is set by the auth middleware. */
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

export {};
