# TodoFlow

Personal todo app built with Next.js 16 (App Router), React 19, Tailwind CSS 4, and SQLite via Drizzle ORM.

## Local Development

```bash
npm install
npm run db:push   # required on first run, creates tables
npm run dev       # http://localhost:3916
```

`db:push` must run before first `dev`/`start` because schema is TypeScript-only and not auto-applied.

## Environment Variables

Copy `.env.example` to `.env.local` only if you need optional features:

- Password protection
- Reminder trigger protection (`CRON_SECRET`)
- Telegram integration

The app can run without env vars.

## Docker (Production)

Use compose for deployment:

```bash
docker compose up -d --build
```

Stop:

```bash
docker compose down
```

Notes:

- Compose deployment is production (`NODE_ENV=production`, `APP_ENV=production`).
- SQLite data persists via named volume `todoflow-data` mounted to `/app/data`.
- Container runs `drizzle-kit migrate` at startup.
- Exposed port: `3916`.

Optional env vars used by compose can come from shell or env file:

- `CRON_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## MCP Bridge

This repo includes an MCP server for tool-based API operations:

```bash
npm run mcp:start
```

See [`mcp/README.md`](./mcp/README.md) for tool list and Claude Code configuration.
