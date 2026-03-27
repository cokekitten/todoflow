<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: TodoFlow

Personal todo app. Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + SQLite (better-sqlite3 via Drizzle ORM).

## Local Development

```bash
npm install
npm run db:push   # REQUIRED on first run — creates all SQLite tables
npm run dev       # starts on http://localhost:3916
```

**`db:push` must be run before the first `dev` or `start`.** The SQLite file (`data/todoflow.db`) is created automatically, but tables are not — Drizzle schema is TypeScript-only and does not auto-migrate.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values as needed. The app runs without any env vars (no auth, no Telegram), but password protection and reminders require them.

## Database

- File: `data/todoflow.db` (gitignored)
- Schema: `src/server/db/schema.ts`
- Migrations: `npm run db:push` (apply schema to db), `npm run db:generate` (generate migration files)
- The `data/` directory is created automatically on startup; the tables are not.

## Port

Fixed at **3916** (set in `package.json` dev/start scripts and `Dockerfile`).

## Docker Deployment

```bash
# Build
docker build -t todoflow .

# Run (mount a volume for persistent data)
docker run -d \
  --name todoflow \
  -p 3916:3916 \
  -v todoflow-data:/app/data \
  --env-file .env.local \
  todoflow
```

The container runs `drizzle-kit migrate` automatically before starting the server, so tables are created on first launch. Mount `/app/data` as a named volume to persist the SQLite database across container restarts.

## Key Architecture Notes

- **No middleware** — auth is handled inside API routes via `src/server/auth/`
- **Responsive layout** — three breakpoints: mobile (<768px), tablet (768–1023px), desktop (≥1024px). Controlled by `useViewport()` in `src/lib/use-viewport.ts`
- **Port** — hardcoded to 3916 everywhere; change in `package.json` and `Dockerfile` if needed
