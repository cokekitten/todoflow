import assert from "node:assert/strict";
import test from "node:test";

import { createAuthTools } from "./auth";

test("auth_check calls GET /api/auth/check", async () => {
  const calls: unknown[] = [];
  const fakeApi = {
    request: async (args: unknown) => {
      calls.push(args);
      return { ok: true as const, status: 200, data: { authRequired: false } };
    },
  };

  const tools = createAuthTools(fakeApi);
  const result = await tools.auth_check.execute({});

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [{ path: "/api/auth/check", method: "GET", write: false }]);
});
