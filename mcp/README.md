# TodoFlow MCP Server

Standalone MCP adapter for TodoFlow HTTP APIs.

## Start

```bash
npm run mcp:start
```

## Env

- `TODOFLOW_BASE_URL` default: `http://localhost:3916`
- `TODOFLOW_NO_AUTH_ONLY` default: `true`
- `TODOFLOW_TIMEOUT_MS` default: `8000`
- `TODOFLOW_CRON_SECRET` optional fallback secret for `reminder_trigger`

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

## Tools

- `auth_check`
- `todo_list`, `todo_create`, `todo_update`, `todo_delete`, `todo_reorder`
- `tag_list`, `tag_create`, `tag_update`, `tag_delete`, `tag_reorder`
- `settings_get`, `settings_update`
- `reminder_test`, `reminder_trigger`
