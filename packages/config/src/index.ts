import { z } from 'zod';

/**
 * Shared, framework-agnostic configuration helpers.
 *
 * Each consuming package declares *only* the env vars it needs and parses them
 * lazily, so importing a package never throws on unrelated missing vars (e.g.
 * the logger does not require `MONGODB_URI`). Validation happens on first use.
 */

export const nodeEnvSchema = z.enum(['development', 'test', 'production']).default('development');

export const logLevelSchema = z
  .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
  .default('info');

export type NodeEnv = z.infer<typeof nodeEnvSchema>;
export type LogLevel = z.infer<typeof logLevelSchema>;

/** Parse a source (defaults to `process.env`) against a schema, throwing a readable error. */
export function parseEnv<T extends z.ZodType>(
  schema: T,
  source: Record<string, string | undefined> = process.env,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`[@medai/config] Invalid environment variables:\n${issues}`);
  }
  return result.data;
}

/** Wrap a schema so it is parsed once, on first access, then memoized. */
export function lazyEnv<T extends z.ZodType>(schema: T): () => z.infer<T> {
  let cached: z.infer<T> | null = null;
  return () => {
    if (cached === null) {
      cached = parseEnv(schema);
    }
    return cached;
  };
}

export { z };
