export type McpEnv = {
  baseUrl: string;
  noAuthOnly: boolean;
  timeoutMs: number;
  cronSecret?: string;
};

export function loadEnv(env: NodeJS.ProcessEnv = process.env): McpEnv {
  return {
    baseUrl: env.TODOFLOW_BASE_URL ?? "http://localhost:3916",
    noAuthOnly: (env.TODOFLOW_NO_AUTH_ONLY ?? "true") !== "false",
    timeoutMs: Number(env.TODOFLOW_TIMEOUT_MS ?? 8000),
    cronSecret: env.TODOFLOW_CRON_SECRET,
  };
}
