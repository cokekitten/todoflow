# TodoFlow

A self-hosted personal todo app with drag-and-drop, tags, Telegram reminders, and built-in MCP support for AI assistant integration.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · SQLite · Drizzle ORM

---

## Features

- **Todos & tags** — create, edit, reorder via drag-and-drop
- **Password protection** — optional bcrypt-based access control
- **Telegram reminders** — trigger reminders via bot integration
- **MCP server** — built-in [Model Context Protocol](https://modelcontextprotocol.io) HTTP bridge for Claude Desktop, Claude Code, and other MCP clients
- **Docker-ready** — single `docker compose up` for production deployment
- **Responsive** — mobile, tablet, and desktop layouts

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Local Development

```bash
git clone https://github.com/your-username/todoflow.git
cd todoflow

npm install
npm run db:push   # Required on first run — creates SQLite tables
npm run dev       # http://localhost:3916
```

> **Note:** `db:push` must be run before the first `dev` or `start`. The SQLite file (`data/todoflow.db`) is created automatically, but tables are not.

---

## Environment Variables

Copy `.env.example` to `.env.local`. The app runs without any env vars, but the following unlock optional features:

| Variable | Description |
|---|---|
| `APP_PASSWORD` | Enables password protection |
| `CRON_SECRET` | Protects the reminder trigger endpoint |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for reminders |
| `TELEGRAM_CHAT_ID` | Telegram chat ID to send reminders to |

---

## Docker Deployment

```bash
# Build and start (production)
docker compose up -d --build

# Stop
docker compose down
```

- Runs with `NODE_ENV=production`
- SQLite data persists via named volume `todoflow-data` → `/app/data`
- Migrations run automatically at container startup
- Web app: port **3916**
- MCP server: port **3917** (`/mcp`)

Optional env vars can be passed from your shell or an env file.

---

## MCP Integration

TodoFlow ships with an HTTP MCP server, enabling AI assistants to read and manage your todos as tools.

### Start (standalone)

```bash
npm run mcp:start:http
# Endpoint: http://localhost:3917/mcp
```

With Docker Compose, the MCP service starts automatically alongside the app.

### Available Tools

| Tool | Description |
|---|---|
| `todo_list` / `todo_create` / `todo_update` / `todo_delete` / `todo_reorder` | Todo CRUD and ordering |
| `tag_list` / `tag_create` / `tag_update` / `tag_delete` / `tag_reorder` | Tag management |
| `settings_get` / `settings_update` | App settings |
| `reminder_test` / `reminder_trigger` | Telegram reminder controls |
| `auth_check` | Check authentication status |

### Client Configuration

Point any Streamable HTTP MCP client to:

```
http://localhost:3917/mcp
```

For remote access, replace `localhost` with your server's IP or domain and secure the endpoint via firewall or reverse proxy.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Database | SQLite via better-sqlite3 + Drizzle ORM |
| Drag & drop | dnd-kit |
| Validation | Zod |
| Auth | bcrypt (password hashing) |
| MCP | `@modelcontextprotocol/sdk` |
| Deployment | Docker + Docker Compose |

---

## Database

- File: `data/todoflow.db` (gitignored)
- Schema: [`src/server/db/schema.ts`](./src/server/db/schema.ts)

```bash
npm run db:push      # Apply schema changes to the database
npm run db:generate  # Generate migration files
npm run db:studio    # Open Drizzle Studio (visual DB browser)
```
