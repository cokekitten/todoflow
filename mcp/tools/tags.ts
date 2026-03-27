import { z } from "zod";

import type { ApiClient, ToolMap } from "../lib/tool";

export function createTagTools(api: ApiClient): ToolMap {
  return {
    tag_list: {
      description: "List all tags.",
      inputSchema: z.object({}).strict(),
      execute: async () => api.request({ path: "/api/tags", method: "GET", write: false }),
    },
    tag_create: {
      description: "Create a tag.",
      inputSchema: z
        .object({
          name: z.string().min(1),
          color: z.string().optional(),
        })
        .strict(),
      execute: async (args) =>
        api.request({
          path: "/api/tags",
          method: "POST",
          body: args,
          write: true,
        }),
    },
    tag_update: {
      description: "Update a tag by id.",
      inputSchema: z
        .object({
          id: z.string().min(1),
          name: z.string().min(1).optional(),
          color: z.string().optional(),
          sortOrder: z.number().int().optional(),
        })
        .strict()
        .refine((input) => Object.keys(input).some((k) => k !== "id"), "Provide at least one field to update"),
      execute: async (args) => {
        const { id, ...body } = args;
        return api.request({
          path: `/api/tags/${id}`,
          method: "PATCH",
          body,
          write: true,
        });
      },
    },
    tag_delete: {
      description: "Delete a tag by id.",
      inputSchema: z.object({ id: z.string().min(1) }).strict(),
      execute: async ({ id }) => api.request({ path: `/api/tags/${id}`, method: "DELETE", write: true }),
    },
    tag_reorder: {
      description: "Persist ordered tag ids.",
      inputSchema: z.object({ ids: z.array(z.string()) }).strict(),
      execute: async (args) =>
        api.request({
          path: "/api/tags/reorder",
          method: "PATCH",
          body: args,
          write: true,
        }),
    },
  };
}
