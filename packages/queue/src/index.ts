import { type Processor, Queue, type QueueOptions, Worker, type WorkerOptions } from 'bullmq';
import { getRedis } from './connection';

export type { Job, Processor } from 'bullmq';
export { Queue, Worker } from 'bullmq';
export { closeRedis, getRedis } from './connection';

/** Canonical queue names — keep producers and workers in sync via these. */
export const QUEUE_NAMES = {
  reportGeneration: 'report-generation',
  aiInference: 'ai-inference',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/** Job payloads keyed by queue name. */
export interface JobPayloads {
  [QUEUE_NAMES.reportGeneration]: {
    conversationId: string;
    requestedBy: string;
    title: string;
  };
  [QUEUE_NAMES.aiInference]: {
    conversationId: string;
    prompt: string;
    provider?: 'anthropic' | 'openai';
  };
}

const defaultJobOptions: QueueOptions['defaultJobOptions'] = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
};

export function createQueue<N extends QueueName>(name: N, opts?: Partial<QueueOptions>) {
  return new Queue<JobPayloads[N]>(name, {
    connection: getRedis(),
    defaultJobOptions,
    ...opts,
  });
}

export function createWorker<N extends QueueName>(
  name: N,
  processor: Processor<JobPayloads[N]>,
  opts?: Partial<WorkerOptions>,
) {
  return new Worker<JobPayloads[N]>(name, processor, {
    connection: getRedis(),
    concurrency: 5,
    ...opts,
  });
}
