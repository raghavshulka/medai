// Minimal env so `createApp()` can construct (Better Auth secret + a DB URL).
// The DB is never reached in tests — the health check tolerates a failed query.
process.env.NODE_ENV ??= 'test';
process.env.BETTER_AUTH_SECRET ??= 'test-better-auth-secret-0123456789';
process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:5432/test';
