export type ToolErrorCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "AUTH_REQUIRED"
  | "UPSTREAM_ERROR"
  | "NETWORK_ERROR";

export type ToolResult<T = unknown> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: { code: ToolErrorCode; message: string; details?: unknown } };
