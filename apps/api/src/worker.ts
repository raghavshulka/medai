import './load-env';
import { complete } from '@medai/ai';
import { connectMongo } from '@medai/db';
import { createLogger } from '@medai/logger';
import { generateMedicalReport } from '@medai/pdf';
import { closeRedis, createWorker, type Job, QUEUE_NAMES } from '@medai/queue';

const log = createLogger('worker');

async function main(): Promise<void> {
  await connectMongo().catch((err: unknown) => {
    log.warn({ err: err instanceof Error ? err.message : String(err) }, 'Mongo unavailable');
  });

  const reportWorker = createWorker(QUEUE_NAMES.reportGeneration, async (job: Job) => {
    const { conversationId, title } = job.data as { conversationId: string; title: string };
    log.info({ jobId: job.id, conversationId }, 'Generating report');

    const summary = await complete({
      prompt: `Summarize the key findings for conversation ${conversationId} as a concise clinical report body.`,
    });

    const pdf = await generateMedicalReport({
      title,
      sections: [{ heading: 'Summary', body: summary }],
    });

    // In a real deployment, persist `pdf` to object storage and link it on the
    // conversation. Here we just report its size.
    log.info({ jobId: job.id, bytes: pdf.byteLength }, 'Report generated');
    return { bytes: pdf.byteLength };
  });

  reportWorker.on('completed', (job) => log.info({ jobId: job.id }, 'Job completed'));
  reportWorker.on('failed', (job, err) => log.error({ jobId: job?.id, err }, 'Job failed'));

  log.info('Worker started, listening for jobs');

  const shutdown = async (signal: string) => {
    log.info(`${signal} received, closing worker`);
    await reportWorker.close();
    await closeRedis();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void main();
