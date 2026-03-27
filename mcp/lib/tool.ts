import { z } from "zod";

import type { RequestOptions } from "./http";
import type { ToolResult } from "./result";

export type ApiClient = {
  request<T = unknown>(options: RequestOptions): Promise<ToolResult<T>>;
};

export type ToolDefinition<TSchema extends z.ZodTypeAny = z.ZodTypeAny> = {
  description: string;
  inputSchema: TSchema;
  execute: (args: z.infer<TSchema>) => Promise<ToolResult>;
};

export type ToolMap = Record<string, ToolDefinition>;
