import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1 style={{ color: 'var(--accent)' }}>MedAI</h1>
      <p style={{ color: 'var(--muted)' }}>
        A medical AI platform — Turborepo + Bun + Express + Next.js, with MongoDB, Redis, BullMQ,
        and the Vercel AI SDK (Claude &amp; OpenAI).
      </p>
      <p>
        <Link href="/chat">Open the AI assistant →</Link>
      </p>
    </main>
  );
}
