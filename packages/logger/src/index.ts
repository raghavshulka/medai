import { lazyEnv, logLevelSchema, nodeEnvSchema, z } from '@medai/config';
import { type Logger, pino } from 'pino';
import pretty from 'pino-pretty';

const env = lazyEnv(
  z.object({
    NODE_ENV: nodeEnvSchema,
    LOG_LEVEL: logLevelSchema,
  }),
);

export type { Logger };

const REDACT_PATHS = [
  'password',
  'passwordHash',
  'token',
  'secret',
  'twoFactor',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.secret',
  'req.headers.authorization',
  'req.headers.cookie',
];

/** Create a named child-able pino logger. Pretty-prints in development. */
export function createLogger(name?: string): Logger {
  const { NODE_ENV, LOG_LEVEL } = env();
  const options = {
    name,
    level: LOG_LEVEL,
    redact: { paths: REDACT_PATHS, censor: '[redacted]' },
  };

  // Use pino-pretty as a synchronous destination stream rather than a
  // worker-thread transport — the transport's module resolution fails under
  // the Bun runtime. The stream form works everywhere.
  if (NODE_ENV === 'development') {
    return pino(
      options,
      pretty({ colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' }),
    );
  }
  return pino(options);
}

/** Default application logger. */
export const logger: Logger = createLogger('medai');
