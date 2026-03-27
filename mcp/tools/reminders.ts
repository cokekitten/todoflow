import { z } from "zod";

import type { ApiClient, ToolMap } from "../lib/tool";

export function createReminderTools(api: ApiClient, config: { cronSecret?: string }): ToolMap {
  return {
    reminder_test: {
      description: "Send a Telegram test reminder using current settings.",
      inputSchema: z.object({}).strict(),
      execute: async () => api.request({ path: "/api/reminders/test", method: "POST", write: true }),
    },
    reminder_trigger: {
      description: "Trigger reminder dispatch route. Uses cron secret from env or input.",
      inputSchema: z
        .object({
          cronSecret: z.string().optional(),
        })
        .strict(),
      execute: async (args) => {
        const secret = args.cronSecret ?? config.cronSecret;
        const headers = secret ? { authorization: `Bearer ${secret}` } : undefined;

        return api.request({
          path: "/api/reminders/trigger",
          method: "POST",
          headers,
          write: true,
        });
      },
    },
  };
}
