# MedAI

A medical AI platform — Turborepo monorepo managed with **pnpm**, with an
**Express 5** API running on the **Bun** runtime, a **Next.js 16** frontend,
**PostgreSQL** (Prisma 7), **Redis**, **BullMQ**, **Better Auth**, and the
**Vercel AI SDK** (Claude + OpenAI).

## Stack

| Layer | Tech |
| --- | --- |
| Monorepo | Turborepo, pnpm workspaces |
| API | Express 5 on the Bun runtime, Zod, Pino |
| Worker | BullMQ |
| Frontend | Next.js 16, React 19, TanStack Query, AI SDK |
| Data | PostgreSQL via Prisma 7 (pg driver adapter), Redis (ioredis) |
| Auth | Better Auth — email/password, TOTP 2FA, bearer + JWT plugins |
| AI | Vercel AI SDK, `@ai-sdk/anthropic`, `@ai-sdk/openai` |
| Docs | Mintlify |
| Tooling | Biome, Vitest, PDFKit |

> **Two toolchains:** pnpm is the package manager; Bun is the API/worker
> _runtime_ (`bun --watch`). You need both installed.

## Layout

```
apps/
  api/    Express API + BullMQ worker (Bun runtime)
  web/    Next.js frontend
  docs/   Mintlify documentation
packages/
  config/ logger/ db/ auth/ queue/ ai/ pdf/
```

## Getting started

```bash
# 1. Install (runs `prisma generate` via postinstall)
pnpm install

# 2. Configure (set a BETTER_AUTH_SECRET and your AI keys)
cp .env.example .env

# 3. Start Postgres + Redis
pnpm run db:up

# 4. Create the database schema
pnpm run db:push        # or: pnpm run db:migrate

# 5. Run all apps in watch mode
pnpm run dev
```

- API → http://localhost:4000 (`/health`, Better Auth at `/api/auth/*`)
- Web → http://localhost:3000
- Docs → http://localhost:3001

> The web app's chat route needs `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) in
> its environment. Next does not auto-load the root `.env`, so add the key to
> `apps/web/.env.local` for local dev.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm run dev` | Run all apps (Turbo) |
| `pnpm run build` | Build all apps/packages |
| `pnpm run test` | Run Vitest suites |
| `pnpm run typecheck` | Type-check every workspace |
| `pnpm run lint` | Biome lint |
| `pnpm run check` | Biome format + lint (write) |
| `pnpm run db:generate` | Regenerate the Prisma client |
| `pnpm run db:push` / `db:migrate` | Sync / migrate the schema |
| `pnpm run db:up` / `db:down` | Start / stop Postgres + Redis (Docker) |

### Running pieces individually

```bash
pnpm --filter @medai/api dev       # API only (bun --watch)
pnpm --filter @medai/api worker    # BullMQ worker
pnpm --filter @medai/web dev       # Web only
pnpm --filter @medai/docs dev      # Docs only
```

## Auth (Better Auth)

`@medai/auth` configures a Better Auth server instance (Prisma adapter +
`twoFactor`, `bearer`, and `jwt` plugins). The API mounts it under
`/api/auth/*`. Clients authenticate with `Authorization: Bearer <token>`:

```bash
# Sign up
curl -X POST localhost:4000/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d '{"email":"u@example.com","password":"SecurePass123!","name":"User"}'

# Use the returned token on protected routes
curl localhost:4000/api/auth/get-session -H 'Authorization: Bearer <token>'
```

## Notes

This is scaffolding: the AI assistant carries a medical disclaimer and is
informational only — not a substitute for professional medical advice. Replace
the placeholder secrets in `.env` before any real deployment.
