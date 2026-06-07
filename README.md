# MedAI

A medical AI platform — Turborepo monorepo on **Bun**, with an **Express 5** API,
a **Next.js 16** frontend, **MongoDB**, **Redis**, **BullMQ**, and the
**Vercel AI SDK** (Claude + OpenAI).

## Stack

| Layer | Tech |
| --- | --- |
| Monorepo | Turborepo, Bun workspaces |
| API | Bun, Express 5, Zod, Pino |
| Worker | BullMQ |
| Frontend | Next.js 16, React 19, TanStack Query, AI SDK |
| Data | MongoDB (Mongoose 9), Redis (ioredis) |
| AI | Vercel AI SDK, `@ai-sdk/anthropic`, `@ai-sdk/openai` |
| Auth | JWT access/refresh, bcryptjs, speakeasy (TOTP 2FA) |
| Docs | Mintlify |
| Tooling | Biome, Vitest, PDFKit |

## Layout

```
apps/
  api/    Bun + Express API and BullMQ worker
  web/    Next.js frontend
  docs/   Mintlify documentation
packages/
  config/ logger/ db/ auth/ queue/ ai/ pdf/
```

## Getting started

```bash
# 1. Install
bun install

# 2. Configure (set MONGODB_URI, JWT secrets, AI keys)
cp .env.example .env

# 3. Start Redis (MongoDB comes from MONGODB_URI; optional local Mongo: `docker compose --profile mongo up -d`)
bun run db:up

# 4. Run all apps in watch mode
bun run dev
```

- API → http://localhost:4000 (`/health`)
- Web → http://localhost:3000
- Docs → http://localhost:3001

> The web app's chat route needs `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) in
> its environment. Next does not auto-load the root `.env`, so add the key to
> `apps/web/.env.local` for local dev.

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Run all apps (Turbo) |
| `bun run build` | Build all apps/packages |
| `bun run test` | Run Vitest suites |
| `bun run typecheck` | Type-check every workspace |
| `bun run lint` | Biome lint |
| `bun run check` | Biome format + lint (write) |
| `bun run db:up` / `db:down` | Start / stop Redis (Docker) |

### Running pieces individually

```bash
bun --cwd apps/api run dev      # API only
bun --cwd apps/api run worker   # BullMQ worker
bun --cwd apps/web run dev      # Web only
bun --cwd apps/docs run dev     # Docs only
```

## Notes

This is scaffolding: the AI assistant carries a medical disclaimer and is
informational only — not a substitute for professional medical advice. Replace
the placeholder secrets in `.env` before any real deployment.
