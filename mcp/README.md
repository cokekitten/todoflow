# TodoFlow MCP Server

Standalone MCP adapter for TodoFlow HTTP APIs.

## Start (stdio, local client spawns process)

```bash
npm run mcp:start
```

## Start (HTTP, long-running service)

```bash
npm run mcp:start:http
```

Default endpoint: `http://localhost:3917/mcp`

## Env

- `TODOFLOW_BASE_URL` default: `http://localhost:3916`
- `TODOFLOW_NO_AUTH_ONLY` default: `true`
- `TODOFLOW_TIMEOUT_MS` default: `8000`
- `TODOFLOW_CRON_SECRET` optional fallback secret for `reminder_trigger`
- `MCP_HTTP_HOST` default: `0.0.0.0` (HTTP mode only)
- `MCP_HTTP_PORT` default: `3917` (HTTP mode only)

## Claude Code config example

```json
{
  "mcpServers": {
    "todoflow": {
      "command": "npm",
      "args": ["run", "mcp:start"],
      "cwd": "/ABSOLUTE/PATH/TO/todoflow",
      "env": {
        "TODOFLOW_BASE_URL": "http://localhost:3916",
        "TODOFLOW_NO_AUTH_ONLY": "true"
      }
    }
  }
}
```

For remote/HTTP MCP clients, point to `http://<host>:3917/mcp`.

## Tools

- `auth_check`
- `todo_list`, `todo_create`, `todo_update`, `todo_delete`, `todo_reorder`
- `tag_list`, `tag_create`, `tag_update`, `tag_delete`, `tag_reorder`
- `settings_get`, `settings_update`
- `reminder_test`, `reminder_trigger`
