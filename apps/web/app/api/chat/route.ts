import { streamChat, type UIMessage } from '@medai/ai';

// Allow streamed responses up to 30s.
export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  const { messages, provider } = (await req.json()) as {
    messages: UIMessage[];
    provider?: 'anthropic' | 'openai';
  };

  const result = await streamChat({ messages, provider });
  return result.toUIMessageStreamResponse();
}
