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
# Build and start (production profile)
docker compose up -d --build

# Stop
docker compose down
```

`docker-compose.yml` is treated as production deployment (`NODE_ENV=production`, `APP_ENV=production`), and persists SQLite data with the named volume `todoflow-data` mounted at `/app/data`.

Optional environment variables (`CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) can be provided from shell environment or an env file when running compose.

Compose also starts an MCP HTTP service on port **3917** (`/mcp`) for always-on MCP access.

## MCP Client Setup (Claude and others)

Only HTTP transport is supported:

- Endpoint: `http://localhost:3917/mcp`

### HTTP MCP clients (Claude Desktop / Claude Code HTTP / other Streamable HTTP clients)

- Endpoint: `http://localhost:3917/mcp`
- Run `docker compose up -d --build` first so `todoflow-mcp` is online.
- If your client connects from another machine, replace `localhost` with server IP/domain and secure access via firewall/reverse proxy.

## Key Architecture Notes

- **No middleware** — auth is handled inside API routes via `src/server/auth/`
- **Responsive layout** — three breakpoints: mobile (<768px), tablet (768–1023px), desktop (≥1024px). Controlled by `useViewport()` in `src/lib/use-viewport.ts`
- **Port** — hardcoded to 3916 everywhere; change in `package.json` and `Dockerfile` if needed
