import { NextRequest, NextResponse } from "next/server";

import { updateTodo } from "@/server/todos";

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as { ids: string[] };

  if (!Array.isArray(body.ids)) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }

  for (let i = 0; i < body.ids.length; i++) {
    updateTodo(body.ids[i], { sortOrder: i });
  }

  return NextResponse.json({ ok: true });
}
