import { NextRequest, NextResponse } from "next/server";

import { deleteRecurringScoped, updateRecurringScoped, type RecurringScope } from "@/server/recurring";
import { deleteTodo, getTodoById, updateTodo } from "@/server/todos";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const scope = new URL(request.url).searchParams.get("scope") as RecurringScope | null;

  if (scope && body.title) {
    const todo = getTodoById(id);
    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }
    if (todo.recurringId) {
      updateRecurringScoped(id, { title: body.title }, scope);
      const updated = getTodoById(id);
      return NextResponse.json(updated);
    }
  }

  const todo = updateTodo(id, body);
  if (!todo) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }
  return NextResponse.json(todo);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const scope = new URL(request.url).searchParams.get("scope") as RecurringScope | null;

  if (scope) {
    const todo = getTodoById(id);
    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }
    if (todo.recurringId) {
      const deleted = deleteRecurringScoped(id, scope);
      if (!deleted) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }
  }

  const deleted = deleteTodo(id);
  if (!deleted) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
