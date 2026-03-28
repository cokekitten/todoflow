import { z } from "zod";

import type { ApiClient, ToolMap } from "../lib/tool";

export function createRecurringTools(api: ApiClient): ToolMap {
  return {
    recurring_renew: {
      description:
        "Extend instance generation for recurring templates approaching their horizon. Idempotent.",
      inputSchema: z.object({}).strict(),
      execute: async () =>
        api.request({
          path: "/api/recurring/renew",
          method: "POST",
          write: true,
        }),
    },
  };
}
