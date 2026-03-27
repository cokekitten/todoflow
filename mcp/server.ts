import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createConfiguredMcpServer } from "./lib/register-tools";

async function main() {
  const server = createConfiguredMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
