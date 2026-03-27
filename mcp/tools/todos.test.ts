import assert from "node:assert/strict";
import test from "node:test";

import { createTodoTools } from "./todos";

test("todo_create forwards to POST /api/todos with write=true", async () => {
  const calls: unknown[] = [];
  const fakeApi = {
    request: async (args: unknown) => {
      calls.push(args);
      return { ok: true as const, status: 201, data: { id: "1" } };
    },
  };

  const tools = createTodoTools(fakeApi);
  const result = await tools.todo_create.execute({ title: "Task", date: null, tagIds: ["t1"] });

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [
    {
      path: "/api/todos",
      method: "POST",
      body: { title: "Task", date: null, tagIds: ["t1"] },
      write: true,
    },
  ]);
});

test("todo_list forwards query parameters", async () => {
  const calls: unknown[] = [];
  const fakeApi = {
    request: async (args: unknown) => {
      calls.push(args);
      return { ok: true as const, status: 200, data: [] };
    },
  };

  const tools = createTodoTools(fakeApi);
  await tools.todo_list.execute({ overdue: "2026-03-27" });

  assert.deepEqual(calls, [
    {
      path: "/api/todos?overdue=2026-03-27",
      method: "GET",
      write: false,
    },
  ]);
});
