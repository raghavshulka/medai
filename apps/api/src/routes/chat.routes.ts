import { complete } from '@medai/ai';
import { createQueue, QUEUE_NAMES } from '@medai/queue';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

export const chatRouter: Router = Router();

const chatSchema = z.object({
  prompt: z.string().min(1).max(8000),
  provider: z.enum(['anthropic', 'openai']).optional(),
  model: z.string().optional(),
});

/** One-shot completion against the configured AI provider. */
chatRouter.post('/chat', requireAuth, async (req, res) => {
  const input = chatSchema.parse(req.body);
  const text = await complete(input);
  res.json({ text });
});

const reportSchema = z.object({
  conversationId: z.string().min(1),
  title: z.string().min(1).max(200),
});

/** Enqueue an async PDF report-generation job (processed by the worker). */
chatRouter.post('/reports', requireAuth, async (req, res) => {
  const input = reportSchema.parse(req.body);
  const queue = createQueue(QUEUE_NAMES.reportGeneration);
  const job = await queue.add('generate', {
    conversationId: input.conversationId,
    title: input.title,
    requestedBy: req.user?.id ?? 'unknown',
  });
  res.status(202).json({ jobId: job.id, status: 'queued' });
});
