# Recurring Todos Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add recurring (repeating) todo support with daily/weekly/monthly/yearly frequencies, using a template + batch-generated instances model.

**Architecture:** A new `recurring_templates` table stores recurrence rules. On creation, instances are batch-generated as regular `todos` rows (up to 20 years). A `recurringId` FK on `todos` links instances to their template. All existing queries work unchanged because instances are normal todo rows. Scoped delete/edit operations use a new `RecurringScopeDialog` component.

**Tech Stack:** Drizzle ORM (SQLite), Next.js 16 App Router, React 19, node:test for server tests, tsx test runner.

**Spec:** `docs/superpowers/specs/2026-03-28-recurring-todos-design.md`

---

## File Structure

**New files:**
- `src/server/recurring/index.ts` — Template CRUD, date generation, instance management, scoped operations
- `src/server/recurring/dates.ts` — Pure date calculation functions (generateOccurrences, etc.)
- `src/server/recurring/dates.test.ts` — Tests for date calculation
- `src/server/recurring/recurring.test.ts` — Tests for template + instance operations
- `src/components/todo/recurring-scope-dialog.tsx` — Three-option scope dialog (delete/edit)
- `src/components/todo/recurring-select.tsx` — Frequency picker for TodoCreate
- `src/app/api/recurring/renew/route.ts` — POST endpoint for renewal
- `mcp/tools/recurring.ts` — MCP tool for recurring_renew

**Modified files:**
- `src/server/db/schema.ts` — Add `recurringTemplates` table, add `recurringId` column to `todos`
- `src/types.ts` — Add `recurringId` to `Todo` interface
- `src/server/todos/index.ts` — Add `recurringId` to `TodoWithTags` interface
- `src/app/api/todos/route.ts` — Handle `frequency`/`endDate` in POST
- `src/app/api/todos/[id]/route.ts` — Handle `scope` query param in DELETE and PATCH
- `src/components/todo/todo-create.tsx` — Add recurring frequency selector
- `src/components/todo/todo-item.tsx` — Add recurring icon, scope dialogs for delete/edit
- `src/lib/use-todo-actions.ts` — Add scope parameter to handleDelete and handleUpdate
- `src/server/reminders/index.ts` — Add renewal check in triggerReminders
- `mcp/tools/todos.ts` — Add `frequency`/`endDate` to todo_create, `scope` to todo_delete/todo_update
- `mcp/lib/register-tools.ts` — Register recurring tools

---

## Chunk 1: Data Model & Date Calculation

### Task 1: Schema Changes

**Files:**
- Modify: `src/server/db/schema.ts`
- Modify: `src/types.ts`
- Modify: `src/server/todos/index.ts:21-30`

- [ ] **Step 1: Add `recurringTemplates` table and `recurringId` column to schema**

In `src/server/db/schema.ts`, add after the `todos` table definition:

```typescript
export const recurringTemplates = sqliteTable("recurring_templates", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  frequency: text("frequency").notNull(), // daily | weekly | monthly | yearly
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  generatedUntil: text("generated_until").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});
```

Add `recurringId` column to the `todos` table:

```typescript
recurringId: text("recurring_id").references(() => recurringTemplates.id, { onDelete: "cascade" }),
```

Add indexes for performance (import `index` from `drizzle-orm/sqlite-core`). Update the `todos` table definition to use the extra config callback for indexes:

```typescript
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
```

Add indexes to the `todos` table via its third argument (extra config callback):

```typescript
export const todos = sqliteTable("todos", {
  // ... existing columns + recurringId ...
}, (table) => [
  index("idx_todos_date").on(table.date),
  index("idx_todos_recurring_date").on(table.recurringId, table.date),
]);
```

- [ ] **Step 2: Update `TodoWithTags` interface in `src/server/todos/index.ts`**

Add `recurringId: string | null;` to the `TodoWithTags` interface (after `updatedAt`).

- [ ] **Step 3: Update `Todo` interface in `src/types.ts`**

Add `recurringId?: string | null;` to the `Todo` interface (after `updatedAt`).

- [ ] **Step 4: Run `npm run db:push` to apply schema**

Run: `npm run db:push`
Expected: Schema applied successfully, `recurring_templates` table created, `recurring_id` column added to `todos`.

- [ ] **Step 5: Commit**

```bash
git add src/server/db/schema.ts src/types.ts src/server/todos/index.ts
git commit -m "feat: add recurring_templates table and recurringId column to todos"
```

### Task 2: Date Calculation Functions

**Files:**
- Create: `src/server/recurring/dates.ts`
- Create: `src/server/recurring/dates.test.ts`

- [ ] **Step 1: Write tests for date generation**

Create `src/server/recurring/dates.test.ts`:

```typescript
import test from "node:test";
import assert from "node:assert/strict";

import { generateOccurrences } from "./dates";

test("daily: generates correct dates", () => {
  const dates = generateOccurrences({
    frequency: "daily",
    startDate: "2026-03-28",
    endDate: "2026-04-01",
  });
  assert.deepEqual(dates, [
    "2026-03-28",
    "2026-03-29",
    "2026-03-30",
    "2026-03-31",
    "2026-04-01",
  ]);
});

test("weekly: generates same day-of-week", () => {
  // 2026-03-28 is Saturday
  const dates = generateOccurrences({
    frequency: "weekly",
    startDate: "2026-03-28",
    endDate: "2026-04-25",
  });
  assert.deepEqual(dates, [
    "2026-03-28",
    "2026-04-04",
    "2026-04-11",
    "2026-04-18",
    "2026-04-25",
  ]);
});

test("monthly: generates same day-of-month", () => {
  const dates = generateOccurrences({
    frequency: "monthly",
    startDate: "2026-01-15",
    endDate: "2026-05-15",
  });
  assert.deepEqual(dates, [
    "2026-01-15",
    "2026-02-15",
    "2026-03-15",
    "2026-04-15",
    "2026-05-15",
  ]);
});

test("monthly: clamps to last day for short months (31st)", () => {
  const dates = generateOccurrences({
    frequency: "monthly",
    startDate: "2026-01-31",
    endDate: "2026-04-30",
  });
  // Jan 31, Feb 28, Mar 31, Apr 30
  assert.deepEqual(dates, [
    "2026-01-31",
    "2026-02-28",
    "2026-03-31",
    "2026-04-30",
  ]);
});

test("monthly: Feb 29 in leap year, Feb 28 in non-leap", () => {
  const dates = generateOccurrences({
    frequency: "monthly",
    startDate: "2028-01-29",
    endDate: "2028-03-29",
  });
  // 2028 is a leap year
  assert.deepEqual(dates, ["2028-01-29", "2028-02-29", "2028-03-29"]);

  const dates2 = generateOccurrences({
    frequency: "monthly",
    startDate: "2026-01-29",
    endDate: "2026-03-29",
  });
  // 2026 is not a leap year
  assert.deepEqual(dates2, ["2026-01-29", "2026-02-28", "2026-03-29"]);
});

test("yearly: generates same month and day", () => {
  const dates = generateOccurrences({
    frequency: "yearly",
    startDate: "2026-03-28",
    endDate: "2030-03-28",
  });
  assert.deepEqual(dates, [
    "2026-03-28",
    "2027-03-28",
    "2028-03-28",
    "2029-03-28",
    "2030-03-28",
  ]);
});

test("yearly: Feb 29 start uses Feb 28 in non-leap years", () => {
  const dates = generateOccurrences({
    frequency: "yearly",
    startDate: "2028-02-29",
    endDate: "2032-02-29",
  });
  assert.deepEqual(dates, [
    "2028-02-29",
    "2029-02-28",
    "2030-02-28",
    "2031-02-28",
    "2032-02-29",
  ]);
});

test("no endDate: generates up to 20 years from startDate", () => {
  const dates = generateOccurrences({
    frequency: "yearly",
    startDate: "2026-03-28",
  });
  assert.equal(dates.length, 21); // 2026 through 2046 inclusive
  assert.equal(dates[0], "2026-03-28");
  assert.equal(dates[dates.length - 1], "2046-03-28");
});

test("endDate before startDate: returns empty array", () => {
  const dates = generateOccurrences({
    frequency: "daily",
    startDate: "2026-03-28",
    endDate: "2026-03-20",
  });
  assert.deepEqual(dates, []);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --test-path-pattern=dates.test`
Expected: FAIL — `./dates` module not found.

- [ ] **Step 3: Implement `generateOccurrences`**

Create `src/server/recurring/dates.ts`:

```typescript
export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

interface GenerateOptions {
  frequency: Frequency;
  startDate: string;
  endDate?: string | null;
}

const DEFAULT_HORIZON_YEARS = 20;

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseDate(dateStr: string): [number, number, number] {
  const [y, m, d] = dateStr.split("-").map(Number);
  return [y, m, d];
}

export function generateOccurrences(options: GenerateOptions): string[] {
  const { frequency, startDate, endDate } = options;
  const [startYear, startMonth, startDay] = parseDate(startDate);

  const horizonDate = new Date(startYear + DEFAULT_HORIZON_YEARS, startMonth - 1, startDay);
  const effectiveEnd = endDate
    ? new Date(Math.min(new Date(`${endDate}T00:00:00`).getTime(), horizonDate.getTime()))
    : horizonDate;

  const dates: string[] = [];
  let current = new Date(`${startDate}T00:00:00`);

  while (current <= effectiveEnd) {
    dates.push(formatDate(current.getFullYear(), current.getMonth() + 1, current.getDate()));

    switch (frequency) {
      case "daily":
        current.setDate(current.getDate() + 1);
        break;
      case "weekly":
        current.setDate(current.getDate() + 7);
        break;
      case "monthly": {
        const nextMonth = current.getMonth() + 2; // 1-indexed
        const nextYear = current.getFullYear() + (nextMonth > 12 ? 1 : 0);
        const normalizedMonth = nextMonth > 12 ? nextMonth - 12 : nextMonth;
        const maxDay = daysInMonth(nextYear, normalizedMonth);
        const day = Math.min(startDay, maxDay);
        current = new Date(`${formatDate(nextYear, normalizedMonth, day)}T00:00:00`);
        break;
      }
      case "yearly": {
        const ny = current.getFullYear() + 1;
        const maxDay = daysInMonth(ny, startMonth);
        const day = Math.min(startDay, maxDay);
        current = new Date(`${formatDate(ny, startMonth, day)}T00:00:00`);
        break;
      }
    }
  }

  return dates;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --test-path-pattern=dates.test`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/recurring/dates.ts src/server/recurring/dates.test.ts
git commit -m "feat: add date occurrence generation for recurring todos"
```

### Task 3: Recurring Template CRUD & Instance Management

**Files:**
- Create: `src/server/recurring/index.ts`
- Create: `src/server/recurring/recurring.test.ts`

- [ ] **Step 1: Write tests for recurring template operations**

Create `src/server/recurring/recurring.test.ts`. These tests hit the real SQLite database (following the project's integration test pattern). The test file needs to create a temporary database. Since the project uses a shared `db` singleton, tests will use the actual database file and clean up after themselves.

```typescript
import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { db } from "../db";
import { recurringTemplates, todos } from "../db/schema";
import { eq } from "drizzle-orm";

import {
  createRecurringTodo,
  deleteRecurringScoped,
  updateRecurringScoped,
  renewTemplates,
  getTemplateById,
} from "./index";

// Clean up test data after each test
afterEach(() => {
  // Delete all recurring templates (cascade deletes instances)
  const templates = db.select().from(recurringTemplates).all();
  for (const t of templates) {
    db.delete(recurringTemplates).where(eq(recurringTemplates.id, t.id)).run();
  }
});

test("createRecurringTodo: creates template and instances for weekly", () => {
  const result = createRecurringTodo({
    title: "Weekly standup",
    frequency: "weekly",
    startDate: "2026-03-28",
    endDate: "2026-04-25",
  });

  assert.ok(result.templateId);
  const template = getTemplateById(result.templateId);
  assert.ok(template);
  assert.equal(template.title, "Weekly standup");
  assert.equal(template.frequency, "weekly");
  assert.equal(template.startDate, "2026-03-28");
  assert.equal(template.endDate, "2026-04-25");

  // Should have 5 instances: Mar 28, Apr 4, 11, 18, 25
  const instances = db
    .select()
    .from(todos)
    .where(eq(todos.recurringId, result.templateId))
    .all();
  assert.equal(instances.length, 5);
});

test("createRecurringTodo: daily without endDate generates 20 years", () => {
  const result = createRecurringTodo({
    title: "Drink water",
    frequency: "daily",
    startDate: "2026-03-28",
  });

  const instances = db
    .select()
    .from(todos)
    .where(eq(todos.recurringId, result.templateId))
    .all();
  // 20 years of daily = ~7305 (includes leap years)
  assert.ok(instances.length > 7000);
  assert.ok(instances.length < 7400);
});

test("deleteRecurringScoped: 'this' deletes single instance", () => {
  const result = createRecurringTodo({
    title: "Test",
    frequency: "daily",
    startDate: "2026-03-28",
    endDate: "2026-04-01",
  });

  const instances = db
    .select()
    .from(todos)
    .where(eq(todos.recurringId, result.templateId))
    .all();
  const targetInstance = instances.find((i) => i.date === "2026-03-30")!;

  deleteRecurringScoped(targetInstance.id, "this");

  const remaining = db
    .select()
    .from(todos)
    .where(eq(todos.recurringId, result.templateId))
    .all();
  assert.equal(remaining.length, 4); // 5 - 1
  assert.ok(!remaining.some((i) => i.date === "2026-03-30"));
});

test("deleteRecurringScoped: 'thisAndFuture' deletes from date onward and updates template", () => {
  const result = createRecurringTodo({
    title: "Test",
    frequency: "daily",
    startDate: "2026-03-28",
    endDate: "2026-04-01",
  });

  const instances = db
    .select()
    .from(todos)
    .where(eq(todos.recurringId, result.templateId))
    .all();
  const targetInstance = instances.find((i) => i.date === "2026-03-30")!;

  deleteRecurringScoped(targetInstance.id, "thisAndFuture");

  const remaining = db
    .select()
    .from(todos)
    .where(eq(todos.recurringId, result.templateId))
    .all();
  // Only Mar 28, Mar 29 should remain
  assert.equal(remaining.length, 2);

  const template = getTemplateById(result.templateId);
  assert.ok(template);
  assert.equal(template.endDate, "2026-03-29");
});

test("deleteRecurringScoped: 'thisAndFuture' on startDate deletes everything", () => {
  const result = createRecurringTodo({
    title: "Test",
    frequency: "daily",
    startDate: "2026-03-28",
    endDate: "2026-04-01",
  });

  const instances = db
    .select()
    .from(todos)
    .where(eq(todos.recurringId, result.templateId))
    .all();
  const targetInstance = instances.find((i) => i.date === "2026-03-28")!;

  deleteRecurringScoped(targetInstance.id, "thisAndFuture");

  const template = getTemplateById(result.templateId);
  assert.equal(template, null);
});

test("deleteRecurringScoped: 'all' deletes template and all instances", () => {
  const result = createRecurringTodo({
    title: "Test",
    frequency: "daily",
    startDate: "2026-03-28",
    endDate: "2026-04-01",
  });

  const instances = db
    .select()
    .from(todos)
    .where(eq(todos.recurringId, result.templateId))
    .all();

  deleteRecurringScoped(instances[0].id, "all");

  const remaining = db
    .select()
    .from(todos)
    .where(eq(todos.recurringId, result.templateId))
    .all();
  assert.equal(remaining.length, 0);

  const template = getTemplateById(result.templateId);
  assert.equal(template, null);
});

test("updateRecurringScoped: 'this' updates single instance title", () => {
  const result = createRecurringTodo({
    title: "Original",
    frequency: "daily",
    startDate: "2026-03-28",
    endDate: "2026-03-30",
  });

  const instances = db
    .select()
    .from(todos)
    .where(eq(todos.recurringId, result.templateId))
    .all();
  const target = instances.find((i) => i.date === "2026-03-29")!;

  updateRecurringScoped(target.id, { title: "Changed" }, "this");

  const updated = db.select().from(todos).where(eq(todos.id, target.id)).get()!;
  assert.equal(updated.title, "Changed");

  // Others should not change
  const other = instances.find((i) => i.date === "2026-03-28")!;
  const otherRow = db.select().from(todos).where(eq(todos.id, other.id)).get()!;
  assert.equal(otherRow.title, "Original");
});

test("updateRecurringScoped: 'thisAndFuture' updates template and future uncompleted instances", () => {
  const result = createRecurringTodo({
    title: "Original",
    frequency: "daily",
    startDate: "2026-03-28",
    endDate: "2026-03-31",
  });

  const instances = db
    .select()
    .from(todos)
    .where(eq(todos.recurringId, result.templateId))
    .all();
  const target = instances.find((i) => i.date === "2026-03-30")!;

  updateRecurringScoped(target.id, { title: "New title" }, "thisAndFuture");

  const template = getTemplateById(result.templateId)!;
  assert.equal(template.title, "New title");

  // Mar 28, 29 should keep original; Mar 30, 31 should be updated
  const all = db
    .select()
    .from(todos)
    .where(eq(todos.recurringId, result.templateId))
    .all();
  for (const inst of all) {
    if (inst.date! >= "2026-03-30") {
      assert.equal(inst.title, "New title");
    } else {
      assert.equal(inst.title, "Original");
    }
  }
});

test("updateRecurringScoped: 'all' updates template and all uncompleted instances", () => {
  const result = createRecurringTodo({
    title: "Original",
    frequency: "daily",
    startDate: "2026-03-28",
    endDate: "2026-03-30",
  });

  const instances = db
    .select()
    .from(todos)
    .where(eq(todos.recurringId, result.templateId))
    .all();

  updateRecurringScoped(instances[0].id, { title: "All changed" }, "all");

  const all = db
    .select()
    .from(todos)
    .where(eq(todos.recurringId, result.templateId))
    .all();
  for (const inst of all) {
    assert.equal(inst.title, "All changed");
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --test-path-pattern=recurring.test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement recurring template operations**

Create `src/server/recurring/index.ts`:

```typescript
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
        // Deleting from start = delete all
        db.delete(recurringTemplates).where(eq(recurringTemplates.id, templateId)).run();
        return true;
      }

      // Delete instances with date >= this instance's date
      db.delete(todos)
        .where(
          and(
            eq(todos.recurringId, templateId),
            gte(todos.date, instance.date!),
          ),
        )
        .run();

      // Update template endDate to day before
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
      // Re-read inside transaction for atomicity
      const current = db
        .select()
        .from(recurringTemplates)
        .where(eq(recurringTemplates.id, template.id))
        .get();
      if (!current || current.generatedUntil >= threshold) return false;

      // Generate from day after generatedUntil, but use ORIGINAL startDate
      // to preserve frequency alignment (e.g., monthly on the 31st)
      const nextDay = new Date(`${current.generatedUntil}T00:00:00`);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextStart = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")}`;

      // Generate using original startDate for correct alignment, then filter
      const allDates = generateOccurrences({
        frequency: current.frequency as Frequency,
        startDate: current.startDate,
        // No endDate — will generate 20 years from original startDate
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --test-path-pattern=recurring.test`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/recurring/index.ts src/server/recurring/recurring.test.ts
git commit -m "feat: add recurring template CRUD and scoped operations"
```

---

## Chunk 2: API Routes

### Task 4: Recurring Renew Endpoint

**Files:**
- Create: `src/app/api/recurring/renew/route.ts`

- [ ] **Step 1: Create the renew endpoint**

Create `src/app/api/recurring/renew/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { renewTemplates } from "@/server/recurring";

export async function POST() {
  const renewed = renewTemplates();
  return NextResponse.json({ ok: true, renewed });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/recurring/renew/route.ts
git commit -m "feat: add POST /api/recurring/renew endpoint"
```

### Task 5: Modify POST `/api/todos` for Recurring Creation

**Files:**
- Modify: `src/app/api/todos/route.ts:52-70`

- [ ] **Step 1: Add recurring support to POST handler**

In `src/app/api/todos/route.ts`, update the `POST` function. Add `frequency` and `endDate` to the body type. When `frequency` is provided, call `createRecurringTodo` instead of `createTodo`:

```typescript
import { createRecurringTodo } from "@/server/recurring";
```

Update the body type:

```typescript
const body = (await request.json()) as {
  title?: string;
  date?: string | null;
  tagIds?: string[];
  frequency?: "daily" | "weekly" | "monthly" | "yearly";
  endDate?: string | null;
};
```

After the title validation, add the recurring branch:

```typescript
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
```

Keep the existing `createTodo` call as the else branch (no frequency = normal todo).

- [ ] **Step 2: Commit**

```bash
git add src/app/api/todos/route.ts
git commit -m "feat: support frequency/endDate in POST /api/todos for recurring creation"
```

### Task 6: Modify DELETE and PATCH `/api/todos/[id]` for Scoped Operations

**Files:**
- Modify: `src/app/api/todos/[id]/route.ts`

- [ ] **Step 1: Add scope parameter handling**

Update `src/app/api/todos/[id]/route.ts`:

Add imports:

```typescript
import { deleteRecurringScoped, updateRecurringScoped, type RecurringScope } from "@/server/recurring";
import { getTodoById } from "@/server/todos";
```

Update the `DELETE` handler to read `scope` from query params:

```typescript
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

  // Fallback to regular delete
  const deleted = deleteTodo(id);
  if (!deleted) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
```

Update the `PATCH` handler to read `scope` from query params:

```typescript
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

  // Fallback to regular update (handles date change detach too)
  const todo = updateTodo(id, body);
  if (!todo) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }
  return NextResponse.json(todo);
}
```

- [ ] **Step 2: Handle date change detachment in `updateTodo`**

In `src/server/todos/index.ts`, modify `updateTodo` to clear `recurringId` when date is changed on a recurring instance:

After `if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;` add:

```typescript
if (input.date !== undefined) {
  // Check if this is a recurring instance getting its date changed — detach it
  const isRecurring = existing.recurringId !== null && existing.recurringId !== undefined;
  if (isRecurring && input.date !== existing.date) {
    updates.recurringId = null;
  }
}
```

Note: This requires the `updates` type to accommodate `recurringId`. The spread `...todo` from `attachTags` will already include `recurringId` since it's on the database row, so no further query changes needed.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/todos/[id]/route.ts src/server/todos/index.ts
git commit -m "feat: add scoped delete/update and date-change detach for recurring todos"
```

---

## Chunk 3: MCP Tools

### Task 7: Update MCP Todo Tools

**Files:**
- Modify: `mcp/tools/todos.ts`

- [ ] **Step 1: Add `frequency` and `endDate` to `todo_create`**

In `mcp/tools/todos.ts`, update the `todo_create` input schema:

```typescript
todo_create: {
  description: "Create a todo. Provide frequency to create a recurring todo.",
  inputSchema: z
    .object({
      title: z.string().min(1),
      date: z.string().nullable().optional(),
      tagIds: z.array(z.string()).optional(),
      frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
      endDate: z.string().nullable().optional(),
    })
    .strict()
    .refine(
      (input) => !input.frequency || input.date,
      "Date is required when frequency is set",
    ),
  execute: async (args) =>
    api.request({
      path: "/api/todos",
      method: "POST",
      body: {
        title: args.title,
        date: args.date ?? null,
        tagIds: args.tagIds ?? [],
        ...(args.frequency ? { frequency: args.frequency, endDate: args.endDate ?? null } : {}),
      },
      write: true,
    }),
},
```

- [ ] **Step 2: Add `scope` to `todo_delete`**

```typescript
todo_delete: {
  description: "Delete a todo by id. For recurring todos, use scope to control deletion range.",
  inputSchema: z
    .object({
      id: z.string().min(1),
      scope: z.enum(["this", "thisAndFuture", "all"]).optional(),
    })
    .strict(),
  execute: async ({ id, scope }) => {
    const params = scope ? `?scope=${scope}` : "";
    return api.request({
      path: `/api/todos/${id}${params}`,
      method: "DELETE",
      write: true,
    });
  },
},
```

- [ ] **Step 3: Add `scope` to `todo_update`**

```typescript
todo_update: {
  description: "Update a todo by id. For recurring todos, use scope to control update range.",
  inputSchema: z
    .object({
      id: z.string().min(1),
      title: z.string().min(1).optional(),
      completed: z.boolean().optional(),
      date: z.string().nullable().optional(),
      tagIds: z.array(z.string()).optional(),
      scope: z.enum(["this", "thisAndFuture", "all"]).optional(),
    })
    .strict()
    .refine((input) => Object.keys(input).some((k) => k !== "id" && k !== "scope"), "Provide at least one field to update"),
  execute: async (args) => {
    const { id, scope, ...body } = args;
    const params = scope ? `?scope=${scope}` : "";
    return api.request({
      path: `/api/todos/${id}${params}`,
      method: "PATCH",
      body,
      write: true,
    });
  },
},
```

- [ ] **Step 4: Commit**

```bash
git add mcp/tools/todos.ts
git commit -m "feat: add recurring params to MCP todo_create, todo_delete, todo_update"
```

### Task 8: Add MCP Recurring Renew Tool

**Files:**
- Create: `mcp/tools/recurring.ts`
- Modify: `mcp/lib/register-tools.ts`

- [ ] **Step 1: Create the recurring renew MCP tool**

Create `mcp/tools/recurring.ts`:

```typescript
import { z } from "zod";

import type { ApiClient, ToolMap } from "../lib/tool";

export function createRecurringTools(api: ApiClient): ToolMap {
  return {
    recurring_renew: {
      description:
        "Extend instance generation for recurring templates approaching their horizon. Idempotent.",
      inputSchema: z.object({}).strict(),
      execute: async () =>
        api.request({
          path: "/api/recurring/renew",
          method: "POST",
          write: true,
        }),
    },
  };
}
```

- [ ] **Step 2: Register in `register-tools.ts`**

In `mcp/lib/register-tools.ts`, add import:

```typescript
import { createRecurringTools } from "../tools/recurring";
```

Add to the `buildToolMap` return object:

```typescript
...createRecurringTools(api),
```

- [ ] **Step 3: Commit**

```bash
git add mcp/tools/recurring.ts mcp/lib/register-tools.ts
git commit -m "feat: add recurring_renew MCP tool"
```

### Task 9: Update MCP Tests

**Files:**
- Modify: `mcp/tools/todos.test.ts`

- [ ] **Step 1: Add test for recurring todo_create**

Append to `mcp/tools/todos.test.ts`:

```typescript
test("todo_create forwards frequency and endDate for recurring", async () => {
  const calls: unknown[] = [];
  const fakeApi = {
    request: async (args: unknown) => {
      calls.push(args);
      return { ok: true as const, status: 201, data: { templateId: "t1" } };
    },
  };

  const tools = createTodoTools(fakeApi);
  await tools.todo_create.execute({
    title: "Daily water",
    date: "2026-03-28",
    tagIds: [],
    frequency: "daily",
    endDate: null,
  });

  assert.deepEqual(calls, [
    {
      path: "/api/todos",
      method: "POST",
      body: {
        title: "Daily water",
        date: "2026-03-28",
        tagIds: [],
        frequency: "daily",
        endDate: null,
      },
      write: true,
    },
  ]);
});

test("todo_delete forwards scope as query parameter", async () => {
  const calls: unknown[] = [];
  const fakeApi = {
    request: async (args: unknown) => {
      calls.push(args);
      return { ok: true as const, status: 200, data: { ok: true } };
    },
  };

  const tools = createTodoTools(fakeApi);
  await tools.todo_delete.execute({ id: "abc", scope: "thisAndFuture" });

  assert.deepEqual(calls, [
    {
      path: "/api/todos/abc?scope=thisAndFuture",
      method: "DELETE",
      write: true,
    },
  ]);
});

test("todo_update forwards scope as query parameter", async () => {
  const calls: unknown[] = [];
  const fakeApi = {
    request: async (args: unknown) => {
      calls.push(args);
      return { ok: true as const, status: 200, data: { id: "abc" } };
    },
  };

  const tools = createTodoTools(fakeApi);
  await tools.todo_update.execute({ id: "abc", title: "New", scope: "all" });

  assert.deepEqual(calls, [
    {
      path: "/api/todos/abc?scope=all",
      method: "PATCH",
      body: { title: "New" },
      write: true,
    },
  ]);
});
```

- [ ] **Step 2: Run MCP tests**

Run: `npm run mcp:test`
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add mcp/tools/todos.test.ts
git commit -m "test: add MCP tests for recurring params"
```

---

## Chunk 4: Reminder Renewal Integration

### Task 10: Add Renewal Check to Reminder Cron

**Files:**
- Modify: `src/server/reminders/index.ts:105-177`

- [ ] **Step 1: Add renewal call in `triggerReminders`**

At the top of `src/server/reminders/index.ts`, add import:

```typescript
import { renewTemplates } from "../recurring";
```

At the beginning of the `triggerReminders` function (after `const result`), add:

```typescript
// Renew recurring templates approaching their generation horizon
try {
  renewTemplates();
} catch {
  // Non-critical — don't block reminder delivery
}
```

- [ ] **Step 2: Commit**

```bash
git add src/server/reminders/index.ts
git commit -m "feat: trigger recurring template renewal in reminder cron"
```

---

## Chunk 5: UI Components

### Task 11: RecurringScopeDialog Component

**Files:**
- Create: `src/components/todo/recurring-scope-dialog.tsx`

- [ ] **Step 1: Create the scope dialog**

Create `src/components/todo/recurring-scope-dialog.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

export type RecurringScope = "this" | "thisAndFuture" | "all";

interface RecurringScopeDialogProps {
  mode: "delete" | "edit";
  onConfirm: (scope: RecurringScope) => void;
  onCancel: () => void;
}

const DELETE_LABELS: Record<RecurringScope, string> = {
  this: "仅删除此天",
  thisAndFuture: "删除此天及未来所有",
  all: "删除整个重复",
};

const EDIT_LABELS: Record<RecurringScope, string> = {
  this: "仅修改此天",
  thisAndFuture: "修改此天及未来所有",
  all: "修改所有",
};

export function RecurringScopeDialog({ mode, onConfirm, onCancel }: RecurringScopeDialogProps) {
  const [selected, setSelected] = useState<RecurringScope>("this");
  const dialogRef = useRef<HTMLDivElement>(null);
  const labels = mode === "delete" ? DELETE_LABELS : EDIT_LABELS;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onCancel();
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={dialogRef}
        className="w-72 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-xl"
      >
        <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">
          {mode === "delete" ? "删除重复待办" : "修改重复待办"}
        </p>

        <div className="mb-4 flex flex-col gap-2">
          {(Object.entries(labels) as [RecurringScope, string][]).map(([scope, label]) => (
            <label
              key={scope}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
            >
              <input
                type="radio"
                name="scope"
                value={scope}
                checked={selected === scope}
                onChange={() => setSelected(scope)}
                className="accent-[var(--accent)]"
              />
              {label}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            className={[
              "rounded-lg px-3 py-1.5 text-xs text-white",
              mode === "delete"
                ? "bg-[var(--danger)] hover:bg-[var(--danger)]/80"
                : "bg-[var(--accent)] hover:bg-[var(--accent)]/80",
            ].join(" ")}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/todo/recurring-scope-dialog.tsx
git commit -m "feat: add RecurringScopeDialog component"
```

### Task 12: Recurring Frequency Selector for TodoCreate

**Files:**
- Create: `src/components/todo/recurring-select.tsx`

- [ ] **Step 1: Create the frequency selector**

Create `src/components/todo/recurring-select.tsx`:

```tsx
"use client";

import { useRef, useState, useEffect } from "react";

export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

interface RecurringSelectProps {
  value: Frequency | null;
  onChange: (frequency: Frequency | null) => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
  none: "不重复",
  daily: "每天",
  weekly: "每周",
  monthly: "每月",
  yearly: "每年",
};

export function RecurringSelect({ value, onChange }: RecurringSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={ref} data-no-drag="true">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] leading-none",
          value
            ? "bg-[var(--accent)]/15 text-[var(--accent-light)]"
            : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        ].join(" ")}
        title="重复"
      >
        <span className="text-sm">↻</span>
        <span className="hidden md:inline">
          {value ? FREQUENCY_LABELS[value] : "重复"}
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1 w-28 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-1 shadow-lg">
          {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onChange(key === "none" ? null : (key as Frequency));
                setOpen(false);
              }}
              className={[
                "w-full px-3 py-1.5 text-left text-[12px]",
                (key === "none" && !value) || key === value
                  ? "bg-[var(--accent)]/10 text-[var(--accent-light)]"
                  : "text-[var(--text-primary)] hover:bg-[var(--bg-primary)]",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/todo/recurring-select.tsx
git commit -m "feat: add RecurringSelect frequency picker component"
```

### Task 13: Update TodoCreate to Support Recurring

**Files:**
- Modify: `src/components/todo/todo-create.tsx`

- [ ] **Step 1: Add recurring state and UI to TodoCreate**

In `src/components/todo/todo-create.tsx`:

Add imports:

```typescript
import { RecurringSelect, type Frequency } from "./recurring-select";
```

Add state inside the `TodoCreate` component (after `showDatePicker` state):

```typescript
const [frequency, setFrequency] = useState<Frequency | null>(null);
const [endDate, setEndDate] = useState<string | null>(null);
const [showEndDatePicker, setShowEndDatePicker] = useState(false);
const endDateButtonRef = useRef<HTMLButtonElement>(null);
```

Update `handleSubmit` — modify the `body` in `fetch`:

```typescript
const bodyData: Record<string, unknown> = {
  title: title.trim(),
  date: effectiveDate,
  tagIds: selectedTagId ? [selectedTagId] : [],
};

if (frequency) {
  bodyData.frequency = frequency;
  bodyData.endDate = endDate;
}

const response = await fetch("/api/todos", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(bodyData),
});
```

In the reset block (after successful creation), add:

```typescript
setFrequency(null);
setEndDate(null);
setShowEndDatePicker(false);
```

In the JSX, add the `RecurringSelect` before the submit button (and conditionally an end-date picker when frequency is set):

```tsx
<RecurringSelect value={frequency} onChange={setFrequency} />

{frequency ? (
  <div className="relative flex-shrink-0" data-no-drag="true">
    <button
      ref={endDateButtonRef}
      type="button"
      onClick={() => setShowEndDatePicker((v) => !v)}
      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--bg-primary)] px-2.5 text-[11px] leading-none text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      title="结束日期"
    >
      <span className="hidden md:inline">{endDate || "无结束日期"}</span>
    </button>
    {showEndDatePicker ? (
      <DatePopover
        value={endDate}
        onSelect={setEndDate}
        onClose={() => setShowEndDatePicker(false)}
        anchorRef={endDateButtonRef}
      />
    ) : null}
  </div>
) : null}
```

When `frequency` is set, ensure the date is required — if `effectiveDate` is null, don't submit:

In the validation check at the top of `handleSubmit`, add:

```typescript
if (frequency && !effectiveDate) {
  return;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/todo/todo-create.tsx
git commit -m "feat: add recurring frequency and end date to TodoCreate"
```

### Task 14: Update TodoItem for Recurring Display and Scope Dialogs

**Files:**
- Modify: `src/components/todo/todo-item.tsx`
- Modify: `src/lib/use-todo-actions.ts`

- [ ] **Step 1: Update `useTodoActions` to support scope parameter**

In `src/lib/use-todo-actions.ts`, update `handleDelete` and `handleUpdate`:

```typescript
const handleDelete = useCallback(
  async (id: string, scope?: string) => {
    const params = scope ? `?scope=${scope}` : "";
    await fetch(`/api/todos/${id}${params}`, { method: "DELETE" });
    notifyTodosChanged();
    onMutate();
  },
  [onMutate],
);

const handleUpdate = useCallback(
  async (id: string, title: string, scope?: string) => {
    const params = scope ? `?scope=${scope}` : "";
    await fetch(`/api/todos/${id}${params}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    notifyTodosChanged();
    onMutate();
  },
  [onMutate],
);
```

Update the `TodoItemProps` interface types for `onDelete` and `onUpdate`:

```typescript
onDelete: (id: string, scope?: string) => void;
onUpdate: (id: string, title: string, scope?: string) => void;
```

- [ ] **Step 2: Update TodoItem to show recurring icon and scope dialogs**

In `src/components/todo/todo-item.tsx`, add imports:

```typescript
import { RecurringScopeDialog, type RecurringScope } from "./recurring-scope-dialog";
```

Add state for dialog visibility (inside the component):

```typescript
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [pendingTitle, setPendingTitle] = useState<string | null>(null);
const isRecurring = Boolean(todo.recurringId);
```

Update the `handleSave` function — when recurring, show scope dialog instead of saving directly:

```typescript
function handleSave() {
  const trimmed = editTitle.trim();
  if (!trimmed || trimmed === todo.title) {
    setIsEditing(false);
    return;
  }

  if (isRecurring) {
    setPendingTitle(trimmed);
    setEditDialogOpen(true);
    setIsEditing(false);
  } else {
    onUpdate(todo.id, trimmed);
    setIsEditing(false);
  }
}
```

Update the delete button click — when recurring, show scope dialog:

```typescript
onClick={() => {
  if (isRecurring) {
    setDeleteDialogOpen(true);
  } else {
    onDelete(todo.id);
  }
}}
```

Add the recurring icon next to the date chip. After the date display area and before the tag area, add:

```tsx
{isRecurring ? (
  <span className="flex-shrink-0 text-[11px] text-[var(--text-dim)]" title="重复待办">↻</span>
) : null}
```

Add the scope dialogs at the end of the component (before the closing `</div>`):

```tsx
{deleteDialogOpen ? (
  <RecurringScopeDialog
    mode="delete"
    onConfirm={(scope) => {
      onDelete(todo.id, scope);
      setDeleteDialogOpen(false);
    }}
    onCancel={() => setDeleteDialogOpen(false)}
  />
) : null}

{editDialogOpen && pendingTitle ? (
  <RecurringScopeDialog
    mode="edit"
    onConfirm={(scope) => {
      onUpdate(todo.id, pendingTitle, scope);
      setEditDialogOpen(false);
      setPendingTitle(null);
    }}
    onCancel={() => {
      setEditDialogOpen(false);
      setPendingTitle(null);
    }}
  />
) : null}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/todo/todo-item.tsx src/lib/use-todo-actions.ts
git commit -m "feat: add recurring icon and scope dialogs to TodoItem"
```

---

## Chunk 6: Verification

### Task 15: Run All Tests

- [ ] **Step 1: Run server tests**

Run: `npm test`
Expected: All tests PASS (dates, recurring, auth).

- [ ] **Step 2: Run MCP tests**

Run: `npm run mcp:test`
Expected: All tests PASS.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Manual smoke test**

Start the dev server:

Run: `npm run db:push && npm run dev`

Test the following:
1. Create a recurring todo (e.g., "每天喝水", frequency=daily, no end date) — verify it appears on today and tomorrow
2. Complete today's instance — verify tomorrow's is still uncompleted
3. Delete a recurring instance with "仅删除此天" — verify only that day is removed
4. Delete with "删除整个重复" — verify all instances removed
5. Edit title with "修改所有" — verify all instances updated
6. Change date on an instance — verify it detaches (no recurring icon)
7. Verify regular (non-recurring) todos still work normally

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during smoke testing"
```
