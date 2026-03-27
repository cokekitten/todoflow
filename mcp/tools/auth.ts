import { z } from "zod";

import type { ApiClient, ToolMap } from "../lib/tool";

export function createAuthTools(api: ApiClient): ToolMap {
  return {
    auth_check: {
      description: "Check whether TodoFlow password auth is enabled.",
      inputSchema: z.object({}).strict(),
      execute: async () => api.request({ path: "/api/auth/check", method: "GET", write: false }),
    },
  };
}
