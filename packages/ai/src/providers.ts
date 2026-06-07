import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { lazyEnv, z } from '@medai/config';
import type { LanguageModel } from 'ai';

const env = lazyEnv(
  z.object({
    ANTHROPIC_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    AI_DEFAULT_PROVIDER: z.enum(['anthropic', 'openai']).default('anthropic'),
  }),
);

export type Provider = 'anthropic' | 'openai';

/** Sensible default model per provider — override per call as needed. */
export const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
};

let anthropic: ReturnType<typeof createAnthropic> | null = null;
let openai: ReturnType<typeof createOpenAI> | null = null;

function anthropicProvider() {
  if (!anthropic) {
    anthropic = createAnthropic({ apiKey: env().ANTHROPIC_API_KEY });
  }
  return anthropic;
}

function openaiProvider() {
  if (!openai) {
    openai = createOpenAI({ apiKey: env().OPENAI_API_KEY });
  }
  return openai;
}

export function defaultProvider(): Provider {
  return env().AI_DEFAULT_PROVIDER;
}

/** Resolve a concrete language model for a provider + model id. */
export function getModel(provider?: Provider, modelId?: string): LanguageModel {
  const resolved = provider ?? defaultProvider();
  const id = modelId ?? DEFAULT_MODELS[resolved];
  return resolved === 'anthropic' ? anthropicProvider()(id) : openaiProvider()(id);
}
