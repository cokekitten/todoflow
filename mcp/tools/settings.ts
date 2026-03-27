import { z } from "zod";

import type { ApiClient, ToolMap } from "../lib/tool";

export function createSettingsTools(api: ApiClient): ToolMap {
  return {
    settings_get: {
      description: "Get TodoFlow settings (safe fields + hasPassword).",
      inputSchema: z.object({}).strict(),
      execute: async () => api.request({ path: "/api/settings", method: "GET", write: false }),
    },
    settings_update: {
      description: "Update TodoFlow settings, including optional password.",
      inputSchema: z
        .object({
          telegram_bot_token: z.string().nullable().optional(),
          telegram_chat_id: z.string().nullable().optional(),
          reminder_time_day_before: z.string().nullable().optional(),
          reminder_time_same_day: z.string().nullable().optional(),
          password: z.string().nullable().optional(),
        })
        .strict()
        .refine((input) => Object.keys(input).length > 0, "Provide at least one setting field"),
      execute: async (args) =>
        api.request({
          path: "/api/settings",
          method: "PUT",
          body: args,
          write: true,
        }),
    },
  };
}
