import { z } from "zod";

import type { ApiClient, ToolMap } from "../lib/tool";

const todoListSchema = z
  .object({
    date: z.string().optional(),
    tagId: z.string().optional(),
    unscheduled: z.boolean().optional(),
    overdue: z.string().optional(),
    upcoming: z.string().optional(),
    calendarMonth: z.string().optional(),
  })
  .strict()
  .refine(
    (input) =>
      [input.date, input.tagId, input.unscheduled, input.overdue, input.upcoming, input.calendarMonth].filter(
        (v) => v !== undefined,
      ).length === 1,
    "Provide exactly one filter parameter",
  );

export function createTodoTools(api: ApiClient): ToolMap {
  return {
    todo_list: {
      description: "List todos by one filter: date, tagId, unscheduled, overdue, upcoming, or calendarMonth.",
      inputSchema: todoListSchema,
      execute: async (args) => {
        const params = new URLSearchParams();
        if (args.date) params.set("date", args.date);
        if (args.tagId) params.set("tagId", args.tagId);
        if (args.unscheduled !== undefined) params.set("unscheduled", String(args.unscheduled));
        if (args.overdue) params.set("overdue", args.overdue);
        if (args.upcoming) params.set("upcoming", args.upcoming);
        if (args.calendarMonth) params.set("calendarMonth", args.calendarMonth);

        return api.request({
          path: `/api/todos?${params.toString()}`,
          method: "GET",
          write: false,
        });
      },
    },
    todo_create: {
      description: "Create a todo.",
      inputSchema: z
        .object({
          title: z.string().min(1),
          date: z.string().nullable().optional(),
          tagIds: z.array(z.string()).optional(),
        })
        .strict(),
      execute: async (args) =>
        api.request({
          path: "/api/todos",
          method: "POST",
          body: {
            title: args.title,
            date: args.date ?? null,
            tagIds: args.tagIds ?? [],
          },
          write: true,
        }),
    },
    todo_update: {
      description: "Update a todo by id.",
      inputSchema: z
        .object({
          id: z.string().min(1),
          title: z.string().min(1).optional(),
          completed: z.boolean().optional(),
          date: z.string().nullable().optional(),
          tagIds: z.array(z.string()).optional(),
        })
        .strict()
        .refine((input) => Object.keys(input).some((k) => k !== "id"), "Provide at least one field to update"),
      execute: async (args) => {
        const { id, ...body } = args;
        return api.request({
          path: `/api/todos/${id}`,
          method: "PATCH",
          body,
          write: true,
        });
      },
    },
    todo_delete: {
      description: "Delete a todo by id.",
      inputSchema: z.object({ id: z.string().min(1) }).strict(),
      execute: async ({ id }) =>
        api.request({
          path: `/api/todos/${id}`,
          method: "DELETE",
          write: true,
        }),
    },
    todo_reorder: {
      description: "Persist ordered todo ids for one context key.",
      inputSchema: z
        .object({
          contextKey: z.string().min(1),
          ids: z.array(z.string()),
        })
        .strict(),
      execute: async (args) =>
        api.request({
          path: "/api/todos/reorder",
          method: "PATCH",
          body: args,
          write: true,
        }),
    },
  };
}
