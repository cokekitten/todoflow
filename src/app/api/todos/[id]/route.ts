import { NextRequest, NextResponse } from "next/server";

import { deleteTodo, updateTodo } from "@/server/todos";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const todo = updateTodo(id, body);

  if (!todo) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  return NextResponse.json(todo);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const deleted = deleteTodo(id);

  if (!deleted) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
