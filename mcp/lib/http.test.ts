import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "./http";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("maps 404 response to NOT_FOUND", async () => {
  const client = createApiClient({
    baseUrl: "http://localhost:3916",
    noAuthOnly: false,
    fetchImpl: async () => jsonResponse({ error: "Todo not found" }, 404),
  });

  const result = await client.request({ path: "/api/todos/x", method: "DELETE", write: true });

  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
  assert.equal(result.error?.code, "NOT_FOUND");
});

test("blocks write operation when auth is enabled in no-auth-only mode", async () => {
  const calls: string[] = [];
  const client = createApiClient({
    baseUrl: "http://localhost:3916",
    noAuthOnly: true,
    fetchImpl: async (input) => {
      const url = typeof input === "string" ? input : input.toString();
      calls.push(url);
      if (url.endsWith("/api/auth/check")) {
        return jsonResponse({ authRequired: true });
      }
      return jsonResponse({ ok: true });
    },
  });

  const result = await client.request({ path: "/api/todos", method: "POST", body: { title: "a" }, write: true });

  assert.equal(result.ok, false);
  assert.equal(result.error?.code, "AUTH_REQUIRED");
  assert.deepEqual(calls, ["http://localhost:3916/api/auth/check"]);
});
