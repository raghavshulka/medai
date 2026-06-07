import { lazyEnv, z } from '@medai/config';
import { createLogger } from '@medai/logger';
import mongoose from 'mongoose';

const log = createLogger('db');

const env = lazyEnv(
  z.object({
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  }),
);

let connecting: Promise<typeof mongoose> | null = null;

/** True when a live connection is established. */
export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Connect to MongoDB. Idempotent and de-duplicated: concurrent callers share a
 * single in-flight connection. Throws on failure — callers that must stay up
 * (e.g. the API server) should catch and degrade gracefully.
 */
export function connectMongo(uri?: string): Promise<typeof mongoose> {
  if (isDbConnected()) {
    return Promise.resolve(mongoose);
  }
  if (connecting) {
    return connecting;
  }

  const mongoUri = uri ?? env().MONGODB_URI;
  mongoose.set('strictQuery', true);

  connecting = mongoose
    .connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
    .then((conn) => {
      log.info('MongoDB connected');
      return conn;
    })
    .catch((err) => {
      connecting = null;
      log.error({ err }, 'MongoDB connection failed');
      throw err;
    });

  return connecting;
}

/** Cleanly close the connection (used on shutdown / in tests). */
export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    connecting = null;
    log.info('MongoDB disconnected');
  }
}

export { mongoose };
