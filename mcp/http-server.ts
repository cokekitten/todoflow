import { createServer, type IncomingMessage } from "node:http";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { createConfiguredMcpServer } from "./lib/register-tools";

const host = process.env.MCP_HTTP_HOST ?? "0.0.0.0";
const port = Number(process.env.MCP_HTTP_PORT ?? 3917);

async function main() {
  const server = createServer(async (req, res) => {
    try {
      if (req.url !== "/mcp") {
        res.statusCode = 404;
        res.end("Not Found");
        return;
      }

      const method = req.method ?? "GET";
      if (!["GET", "POST", "DELETE", "OPTIONS"].includes(method)) {
        res.statusCode = 405;
        res.end("Method Not Allowed");
        return;
      }

      if (method === "OPTIONS") {
        res.statusCode = 204;
        res.end();
        return;
      }

      // SDK 1.28+: stateless transport cannot be reused across requests
      const mcpServer = createConfiguredMcpServer();
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await mcpServer.connect(transport);

      const parsedBody = method === "POST" ? await parseJsonBody(req) : undefined;
      await transport.handleRequest(req, res, parsedBody);
    } catch (error) {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("content-type", "application/json");
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: error instanceof Error ? error.message : "Internal server error",
            },
            id: null,
          }),
        );
      }
    }
  });

  server.listen(port, host, () => {
    process.stdout.write(`MCP Streamable HTTP listening on http://${host}:${port}/mcp\n`);
  });
}

function parseJsonBody(req: IncomingMessage) {
  return new Promise<unknown>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve(undefined);
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
