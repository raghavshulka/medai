import { convertToModelMessages, generateText, streamText, type UIMessage } from 'ai';
import { getModel, type Provider } from './providers';

export type { ModelMessage, UIMessage } from 'ai';

// Re-export the AI SDK primitives consumers commonly need, so apps can import
// everything AI-related from `@medai/ai`.
export {
  convertToModelMessages,
  generateObject,
  generateText,
  streamObject,
  streamText,
  tool,
} from 'ai';
export { DEFAULT_MODELS, defaultProvider, getModel, type Provider } from './providers';

export const MEDICAL_SYSTEM_PROMPT = [
  'You are MedAI, a clinical decision-support assistant for healthcare professionals.',
  'Provide evidence-based, well-structured information and cite guidelines where relevant.',
  'Always include a clear disclaimer that your output is informational only and not a',
  'substitute for professional medical judgement, diagnosis, or treatment. Never invent',
  'dosages, drug interactions, or facts — if uncertain, say so and recommend verification.',
].join(' ');

export interface ChatOptions {
  messages: UIMessage[];
  provider?: Provider;
  model?: string;
  system?: string;
}

/** Stream a chat completion. Pipe the result to an HTTP response in your route. */
export async function streamChat(options: ChatOptions) {
  return streamText({
    model: getModel(options.provider, options.model),
    system: options.system ?? MEDICAL_SYSTEM_PROMPT,
    messages: await convertToModelMessages(options.messages),
  });
}

export interface CompleteOptions {
  prompt: string;
  provider?: Provider;
  model?: string;
  system?: string;
}

/** One-shot text completion (non-streaming). */
export async function complete(options: CompleteOptions): Promise<string> {
  const { text } = await generateText({
    model: getModel(options.provider, options.model),
    system: options.system ?? MEDICAL_SYSTEM_PROMPT,
    prompt: options.prompt,
  });
  return text;
}
