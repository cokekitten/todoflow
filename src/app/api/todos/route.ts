import { NextRequest, NextResponse } from "next/server";

import { createRecurringTodo } from "@/server/recurring";
import {
  createTodo,
  getDatesWithTodos,
  getOverdueTodos,
  getTodosByDate,
  getTodosByTag,
  getUnscheduledTodos,
  getUpcomingDates,
} from "@/server/todos";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const tagId = searchParams.get("tagId");
  const unscheduled = searchParams.get("unscheduled");
  const overdue = searchParams.get("overdue");
  const upcoming = searchParams.get("upcoming");
  const calendarMonth = searchParams.get("calendarMonth");

  if (date) {
    return NextResponse.json(getTodosByDate(date));
  }

  if (tagId) {
    return NextResponse.json(getTodosByTag(tagId));
  }

  if (unscheduled === "true") {
    return NextResponse.json(getUnscheduledTodos());
  }

  if (overdue) {
    return NextResponse.json(getOverdueTodos(overdue));
  }

  if (upcoming) {
    return NextResponse.json(getUpcomingDates(upcoming));
  }

  if (calendarMonth) {
    return NextResponse.json(getDatesWithTodos(calendarMonth));
  }

  return NextResponse.json(
    { error: "Provide date, tagId, unscheduled, overdue, upcoming, or calendarMonth param" },
    { status: 400 },
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    title?: string;
    date?: string | null;
    tagIds?: string[];
    frequency?: "daily" | "weekly" | "monthly" | "yearly";
    endDate?: string | null;
  };

  if (!body.title || body.title.trim() === "") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (body.frequency) {
    if (!body.date) {
      return NextResponse.json({ error: "Date is required for recurring todos" }, { status: 400 });
    }

    const result = createRecurringTodo({
      title: body.title.trim(),
      frequency: body.frequency,
      startDate: body.date,
      endDate: body.endDate,
    });

    return NextResponse.json({ ok: true, templateId: result.templateId }, { status: 201 });
  }

  const todo = createTodo({
    title: body.title.trim(),
    date: body.date ?? null,
    tagIds: body.tagIds ?? [],
  });

  return NextResponse.json(todo, { status: 201 });
}
