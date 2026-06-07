'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { type FormEvent, useState } from 'react';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const busy = status === 'submitted' || status === 'streaming';

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) {
      return;
    }
    void sendMessage({ text });
    setInput('');
  }

  return (
    <main>
      <h1 style={{ color: 'var(--accent)' }}>MedAI Assistant</h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
        Informational only — not a substitute for professional medical advice.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1.5rem 0' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              background: message.role === 'user' ? 'var(--panel)' : 'transparent',
              border: '1px solid #1f2a25',
              borderRadius: 8,
              padding: '0.75rem 1rem',
            }}
          >
            <strong
              style={{ color: 'var(--accent)', fontSize: '0.75rem', textTransform: 'uppercase' }}
            >
              {message.role}
            </strong>
            <div>
              {message.parts.map((part, index) =>
                part.type === 'text' ? (
                  // Streaming text parts have no stable id; index is positionally stable here.
                  // biome-ignore lint/suspicious/noArrayIndexKey: ordered streaming parts
                  <span key={`${message.id}-${index}`}>{part.text}</span>
                ) : null,
              )}
            </div>
          </div>
        ))}
        {busy ? <p style={{ color: 'var(--muted)' }}>Thinking…</p> : null}
      </div>

      <form onSubmit={onSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a clinical question…"
          style={{
            flex: 1,
            padding: '0.6rem 0.8rem',
            borderRadius: 8,
            border: '1px solid #1f2a25',
            background: 'var(--panel)',
            color: 'var(--fg)',
          }}
        />
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: '0.6rem 1.1rem',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#04130d',
            fontWeight: 600,
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </main>
  );
}
