import { and, eq, gte, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { db, sqlite } from "../db";
import { recurringTemplates, todos } from "../db/schema";
import { generateOccurrences, type Frequency } from "./dates";

export interface CreateRecurringInput {
  title: string;
  frequency: Frequency;
  startDate: string;
  endDate?: string | null;
}

export interface RecurringTemplate {
  id: string;
  title: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  generatedUntil: string;
  createdAt: string;
  updatedAt: string;
}

export type RecurringScope = "this" | "thisAndFuture" | "all";

export function getTemplateById(id: string): RecurringTemplate | null {
  return db.select().from(recurringTemplates).where(eq(recurringTemplates.id, id)).get() ?? null;
}

export function createRecurringTodo(input: CreateRecurringInput): { templateId: string } {
  const templateId = uuidv4();
  const now = new Date().toISOString();

  const dates = generateOccurrences({
    frequency: input.frequency,
    startDate: input.startDate,
    endDate: input.endDate,
  });

  const generatedUntil = dates[dates.length - 1] ?? input.startDate;

  const insertAll = sqlite.transaction(() => {
    db.insert(recurringTemplates)
      .values({
        id: templateId,
        title: input.title,
        frequency: input.frequency,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        generatedUntil,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    for (const date of dates) {
      db.insert(todos)
        .values({
          id: uuidv4(),
          title: input.title,
          date,
          recurringId: templateId,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
  });
  insertAll();

  return { templateId };
}

export function deleteRecurringScoped(instanceId: string, scope: RecurringScope): boolean {
  const instance = db.select().from(todos).where(eq(todos.id, instanceId)).get();
  if (!instance || !instance.recurringId) return false;

  const templateId = instance.recurringId;

  switch (scope) {
    case "this":
      db.delete(todos).where(eq(todos.id, instanceId)).run();
      return true;

    case "thisAndFuture": {
      const template = getTemplateById(templateId);
      if (!template) return false;

      if (instance.date === template.startDate) {
        db.delete(recurringTemplates).where(eq(recurringTemplates.id, templateId)).run();
        return true;
      }

      db.delete(todos)
        .where(
          and(
            eq(todos.recurringId, templateId),
            gte(todos.date, instance.date!),
          ),
        )
        .run();

      const dayBefore = new Date(`${instance.date}T00:00:00`);
      dayBefore.setDate(dayBefore.getDate() - 1);
      const newEndDate = `${dayBefore.getFullYear()}-${String(dayBefore.getMonth() + 1).padStart(2, "0")}-${String(dayBefore.getDate()).padStart(2, "0")}`;

      db.update(recurringTemplates)
        .set({ endDate: newEndDate, updatedAt: new Date().toISOString() })
        .where(eq(recurringTemplates.id, templateId))
        .run();

      return true;
    }

    case "all":
      db.delete(recurringTemplates).where(eq(recurringTemplates.id, templateId)).run();
      return true;
  }
}

export function updateRecurringScoped(
  instanceId: string,
  updates: { title?: string },
  scope: RecurringScope,
): boolean {
  const instance = db.select().from(todos).where(eq(todos.id, instanceId)).get();
  if (!instance || !instance.recurringId) return false;

  const templateId = instance.recurringId;
  const now = new Date().toISOString();

  switch (scope) {
    case "this":
      db.update(todos)
        .set({ ...updates, updatedAt: now })
        .where(eq(todos.id, instanceId))
        .run();
      return true;

    case "thisAndFuture": {
      const updateFuture = sqlite.transaction(() => {
        if (updates.title) {
          db.update(recurringTemplates)
            .set({ title: updates.title, updatedAt: now })
            .where(eq(recurringTemplates.id, templateId))
            .run();
        }

        db.update(todos)
          .set({ ...updates, updatedAt: now })
          .where(
            and(
              eq(todos.recurringId, templateId),
              gte(todos.date, instance.date!),
              eq(todos.completed, 0),
            ),
          )
          .run();
      });
      updateFuture();
      return true;
    }

    case "all": {
      const updateAll = sqlite.transaction(() => {
        if (updates.title) {
          db.update(recurringTemplates)
            .set({ title: updates.title, updatedAt: now })
            .where(eq(recurringTemplates.id, templateId))
            .run();
        }

        db.update(todos)
          .set({ ...updates, updatedAt: now })
          .where(
            and(
              eq(todos.recurringId, templateId),
              eq(todos.completed, 0),
            ),
          )
          .run();
      });
      updateAll();
      return true;
    }
  }
}

export function renewTemplates(): number {
  const today = new Date();
  const oneYearFromNow = new Date(today);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const threshold = `${oneYearFromNow.getFullYear()}-${String(oneYearFromNow.getMonth() + 1).padStart(2, "0")}-${String(oneYearFromNow.getDate()).padStart(2, "0")}`;

  const templates = db
    .select()
    .from(recurringTemplates)
    .where(
      and(
        sql`${recurringTemplates.endDate} IS NULL`,
        sql`${recurringTemplates.generatedUntil} < ${threshold}`,
      ),
    )
    .all();

  let renewed = 0;

  for (const template of templates) {
    const doRenew = sqlite.transaction(() => {
      const current = db
        .select()
        .from(recurringTemplates)
        .where(eq(recurringTemplates.id, template.id))
        .get();
      if (!current || current.generatedUntil >= threshold) return false;

      const nextDay = new Date(`${current.generatedUntil}T00:00:00`);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextStart = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")}`;

      const allDates = generateOccurrences({
        frequency: current.frequency as Frequency,
        startDate: current.startDate,
      });
      const dates = allDates.filter((d) => d >= nextStart);

      const now = new Date().toISOString();
      for (const date of dates) {
        db.insert(todos)
          .values({
            id: uuidv4(),
            title: current.title,
            date,
            recurringId: current.id,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }

      const newGeneratedUntil = dates[dates.length - 1] ?? current.generatedUntil;
      db.update(recurringTemplates)
        .set({ generatedUntil: newGeneratedUntil, updatedAt: now })
        .where(eq(recurringTemplates.id, current.id))
        .run();

      return true;
    });

    if (doRenew()) {
      renewed++;
    }
  }

  return renewed;
}
