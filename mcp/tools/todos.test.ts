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

test("todo_create forwards frequency and endDate for recurring", async () => {
  const calls: unknown[] = [];
  const fakeApi = {
    request: async (args: unknown) => {
      calls.push(args);
      return { ok: true as const, status: 201, data: { templateId: "t1" } };
    },
  };

  const tools = createTodoTools(fakeApi);
  await tools.todo_create.execute({
    title: "Daily water",
    date: "2026-03-28",
    tagIds: [],
    frequency: "daily",
    endDate: null,
  });

  assert.deepEqual(calls, [
    {
      path: "/api/todos",
      method: "POST",
      body: {
        title: "Daily water",
        date: "2026-03-28",
        tagIds: [],
        frequency: "daily",
        endDate: null,
      },
      write: true,
    },
  ]);
});

test("todo_delete forwards scope as query parameter", async () => {
  const calls: unknown[] = [];
  const fakeApi = {
    request: async (args: unknown) => {
      calls.push(args);
      return { ok: true as const, status: 200, data: { ok: true } };
    },
  };

  const tools = createTodoTools(fakeApi);
  await tools.todo_delete.execute({ id: "abc", scope: "thisAndFuture" });

  assert.deepEqual(calls, [
    {
      path: "/api/todos/abc?scope=thisAndFuture",
      method: "DELETE",
      write: true,
    },
  ]);
});

test("todo_update forwards scope as query parameter", async () => {
  const calls: unknown[] = [];
  const fakeApi = {
    request: async (args: unknown) => {
      calls.push(args);
      return { ok: true as const, status: 200, data: { id: "abc" } };
    },
  };

  const tools = createTodoTools(fakeApi);
  await tools.todo_update.execute({ id: "abc", title: "New", scope: "all" });

  assert.deepEqual(calls, [
    {
      path: "/api/todos/abc?scope=all",
      method: "PATCH",
      body: { title: "New" },
      write: true,
    },
  ]);
});
