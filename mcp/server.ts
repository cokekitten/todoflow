import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadEnv } from "./lib/env";
import { createApiClient } from "./lib/http";
import type { ToolMap } from "./lib/tool";
import { createAuthTools } from "./tools/auth";
import { createReminderTools } from "./tools/reminders";
import { createSettingsTools } from "./tools/settings";
import { createTagTools } from "./tools/tags";
import { createTodoTools } from "./tools/todos";

function buildToolMap(): ToolMap {
  const env = loadEnv();
  const api = createApiClient({
    baseUrl: env.baseUrl,
    noAuthOnly: env.noAuthOnly,
    timeoutMs: env.timeoutMs,
  });

  return {
    ...createAuthTools(api),
    ...createTodoTools(api),
    ...createTagTools(api),
    ...createSettingsTools(api),
    ...createReminderTools(api, { cronSecret: env.cronSecret }),
  };
}

async function main() {
  const server = new McpServer({
    name: "todoflow-mcp",
    version: "0.1.0",
  });

  const toolMap = buildToolMap();

  for (const [name, tool] of Object.entries(toolMap)) {
    (server as any).registerTool(
      name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args: unknown) => {
        const result = await tool.execute(args as never);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          isError: !result.ok,
        };
      },
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
