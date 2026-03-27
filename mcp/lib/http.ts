import { ToolResult } from "./result";

type FetchLike = typeof fetch;

type ApiClientOptions = {
  baseUrl: string;
  noAuthOnly: boolean;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
};

export type RequestOptions = {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  write?: boolean;
  headers?: Record<string, string>;
};

type AuthCheckResponse = {
  authRequired?: boolean;
};

export function createApiClient(options: ApiClientOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 8_000;
  let authRequiredCache: boolean | null = null;

  async function ensureNoAuthMode(): Promise<boolean> {
    if (!options.noAuthOnly) {
      return true;
    }

    if (authRequiredCache !== null) {
      return !authRequiredCache;
    }

    const response = await fetchImpl(`${options.baseUrl}/api/auth/check`);
    const payload = (await response.json()) as AuthCheckResponse;
    authRequiredCache = Boolean(payload.authRequired);
    return !authRequiredCache;
  }

  async function request<T = unknown>(req: RequestOptions): Promise<ToolResult<T>> {
    if (req.write) {
      const allowed = await ensureNoAuthMode();
      if (!allowed) {
        return {
          ok: false,
          status: 401,
          error: {
            code: "AUTH_REQUIRED",
            message: "Auth is enabled. Current MCP mode only supports no-auth projects.",
          },
        };
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(`${options.baseUrl}${req.path}`, {
        method: req.method ?? "GET",
        headers: {
          "content-type": "application/json",
          ...req.headers,
        },
        body: req.body === undefined ? undefined : JSON.stringify(req.body),
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: {
            code: mapErrorCode(response.status),
            message: getErrorMessage(payload, response.statusText),
            details: payload,
          },
        };
      }

      return {
        ok: true,
        status: response.status,
        data: payload as T,
      };
    } catch (error) {
      return {
        ok: false,
        status: 503,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Network request failed",
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return { request };
}

function mapErrorCode(status: number) {
  if (status === 400) {
    return "BAD_REQUEST";
  }
  if (status === 401 || status === 403) {
    return "AUTH_REQUIRED";
  }
  if (status === 404) {
    return "NOT_FOUND";
  }
  return "UPSTREAM_ERROR";
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }

  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  return fallback || "Request failed";
}
