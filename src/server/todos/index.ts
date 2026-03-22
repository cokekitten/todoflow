import { and, asc, desc, eq, inArray, isNull, lt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { db, sqlite } from "../db";
import { tags, todos, todoTags } from "../db/schema";

export interface CreateTodoInput {
  title: string;
  date?: string | null;
  tagIds?: string[];
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
  date?: string | null;
  sortOrder?: number;
  tagIds?: string[];
}

export interface TodoWithTags {
  id: string;
  title: string;
  completed: number;
  date: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string; color: string | null }[];
}

function attachTags(todoRows: (typeof todos.$inferSelect)[]): TodoWithTags[] {
  if (todoRows.length === 0) {
    return [];
  }

  const todoIds = todoRows.map((todo) => todo.id);
  const tagRows = db
    .select({
      todoId: todoTags.todoId,
      tagId: tags.id,
      tagName: tags.name,
      tagColor: tags.color,
    })
    .from(todoTags)
    .innerJoin(tags, eq(todoTags.tagId, tags.id))
    .where(inArray(todoTags.todoId, todoIds))
    .all();

  const tagMap = new Map<string, { id: string; name: string; color: string | null }[]>();

  for (const row of tagRows) {
    if (!tagMap.has(row.todoId)) {
      tagMap.set(row.todoId, []);
    }

    tagMap.get(row.todoId)?.push({
      id: row.tagId,
      name: row.tagName,
      color: row.tagColor,
    });
  }

  return todoRows.map((todo) => ({
    ...todo,
    tags: tagMap.get(todo.id) ?? [],
  }));
}

export function getTodosByDate(date: string): TodoWithTags[] {
  const rows = db
    .select()
    .from(todos)
    .where(eq(todos.date, date))
    .orderBy(asc(todos.sortOrder), asc(todos.createdAt))
    .all();

  return attachTags(rows);
}

export function getTodosByTag(tagId: string): TodoWithTags[] {
  const todoIds = db
    .select({ todoId: todoTags.todoId })
    .from(todoTags)
    .where(eq(todoTags.tagId, tagId))
    .all()
    .map((row) => row.todoId);

  if (todoIds.length === 0) {
    return [];
  }

  const rows = db
    .select()
    .from(todos)
    .where(inArray(todos.id, todoIds))
    .orderBy(desc(todos.date), asc(todos.sortOrder), asc(todos.createdAt))
    .all();

  return attachTags(rows);
}

export function getUnscheduledTodos(): TodoWithTags[] {
  const rows = db
    .select()
    .from(todos)
    .where(isNull(todos.date))
    .orderBy(asc(todos.sortOrder), asc(todos.createdAt))
    .all();

  return attachTags(rows);
}

export function getOverdueTodos(today: string): TodoWithTags[] {
  const rows = db
    .select()
    .from(todos)
    .where(and(lt(todos.date, today), eq(todos.completed, 0)))
    .orderBy(asc(todos.date), asc(todos.sortOrder), asc(todos.createdAt))
    .all();

  return attachTags(rows);
}

export function getUpcomingDates(today: string, limit = 5): { date: string; count: number }[] {
  const statement = sqlite.prepare(
    "select date, count(*) as count from todos where date > ? and completed = 0 group by date order by date limit ?",
  );

  return statement.all(today, limit) as { date: string; count: number }[];
}

export function getDatesWithTodos(yearMonth: string): string[] {
  const startDate = `${yearMonth}-01`;
  const [yearPart, monthPart] = yearMonth.split("-").map(Number);
  let nextYear = yearPart;
  let nextMonth = monthPart + 1;

  if (nextMonth > 12) {
    nextYear += 1;
    nextMonth = 1;
  }

  const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  const statement = sqlite.prepare(
    "select distinct date from todos where date >= ? and date < ? and date is not null",
  );
  const rows = statement.all(startDate, endDate) as { date: string }[];

  return rows.map((row) => row.date);
}

export function createTodo(input: CreateTodoInput): TodoWithTags {
  const id = uuidv4();
  const now = new Date().toISOString();

  db.insert(todos)
    .values({
      id,
      title: input.title,
      date: input.date ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  if (input.tagIds?.length) {
    for (const tagId of input.tagIds) {
      db.insert(todoTags).values({ todoId: id, tagId }).run();
    }
  }

  return getTodoById(id)!;
}

export function getTodoById(id: string): TodoWithTags | null {
  const row = db.select().from(todos).where(eq(todos.id, id)).get();

  if (!row) {
    return null;
  }

  return attachTags([row])[0] ?? null;
}

export function updateTodo(id: string, input: UpdateTodoInput): TodoWithTags | null {
  const existing = db.select().from(todos).where(eq(todos.id, id)).get();

  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const updates: Partial<typeof todos.$inferInsert> = {
    updatedAt: now,
  };

  if (input.title !== undefined) updates.title = input.title;
  if (input.completed !== undefined) updates.completed = input.completed ? 1 : 0;
  if (input.date !== undefined) updates.date = input.date;
  if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;

  db.update(todos).set(updates).where(eq(todos.id, id)).run();

  if (input.tagIds !== undefined) {
    db.delete(todoTags).where(eq(todoTags.todoId, id)).run();

    for (const tagId of input.tagIds) {
      db.insert(todoTags).values({ todoId: id, tagId }).run();
    }
  }

  return getTodoById(id);
}

export function deleteTodo(id: string): boolean {
  const result = db.delete(todos).where(eq(todos.id, id)).run();
  return result.changes > 0;
}

export function getUncompletedTodosByDate(date: string): TodoWithTags[] {
  const rows = db
    .select()
    .from(todos)
    .where(and(eq(todos.date, date), eq(todos.completed, 0)))
    .orderBy(asc(todos.sortOrder), asc(todos.createdAt))
    .all();

  return attachTags(rows);
}
