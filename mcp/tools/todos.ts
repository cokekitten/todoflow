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
      description: "Create a todo. Provide frequency to create a recurring todo.",
      inputSchema: z
        .object({
          title: z.string().min(1),
          date: z.string().nullable().optional(),
          tagIds: z.array(z.string()).optional(),
          frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
          endDate: z.string().nullable().optional(),
        })
        .strict()
        .refine(
          (input) => !input.frequency || input.date,
          "Date is required when frequency is set",
        ),
      execute: async (args) =>
        api.request({
          path: "/api/todos",
          method: "POST",
          body: {
            title: args.title,
            date: args.date ?? null,
            tagIds: args.tagIds ?? [],
            ...(args.frequency ? { frequency: args.frequency, endDate: args.endDate ?? null } : {}),
          },
          write: true,
        }),
    },
    todo_update: {
      description: "Update a todo by id. For recurring todos, use scope to control update range.",
      inputSchema: z
        .object({
          id: z.string().min(1),
          title: z.string().min(1).optional(),
          completed: z.boolean().optional(),
          date: z.string().nullable().optional(),
          tagIds: z.array(z.string()).optional(),
          scope: z.enum(["this", "thisAndFuture", "all"]).optional(),
        })
        .strict()
        .refine((input) => Object.keys(input).some((k) => k !== "id" && k !== "scope"), "Provide at least one field to update"),
      execute: async (args) => {
        const { id, scope, ...body } = args;
        const params = scope ? `?scope=${scope}` : "";
        return api.request({
          path: `/api/todos/${id}${params}`,
          method: "PATCH",
          body,
          write: true,
        });
      },
    },
    todo_delete: {
      description: "Delete a todo by id. For recurring todos, use scope to control deletion range.",
      inputSchema: z
        .object({
          id: z.string().min(1),
          scope: z.enum(["this", "thisAndFuture", "all"]).optional(),
        })
        .strict(),
      execute: async ({ id, scope }) => {
        const params = scope ? `?scope=${scope}` : "";
        return api.request({
          path: `/api/todos/${id}${params}`,
          method: "DELETE",
          write: true,
        });
      },
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
