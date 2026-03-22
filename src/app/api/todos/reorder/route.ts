import { NextRequest, NextResponse } from "next/server";

import { persistTodoContextOrder } from "@/server/todos";

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as { contextKey?: string; ids?: string[] };

  if (typeof body.contextKey !== "string" || !Array.isArray(body.ids)) {
    return NextResponse.json({ error: "contextKey and ids array required" }, { status: 400 });
  }

  persistTodoContextOrder(body.contextKey, body.ids);

  return NextResponse.json({ ok: true });
}
