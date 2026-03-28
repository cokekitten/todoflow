# Recurring Todos Design Spec

## Overview

Add recurring (repeating) todo support to TodoFlow. Users can set a todo to repeat on a schedule — daily, weekly, monthly, or yearly — with an optional end date. The system uses a **template + instance** model: one template record defines the recurrence rule, and concrete todo instances are batch-generated as real rows in the `todos` table.

## Goals

- Support four recurrence frequencies: daily, weekly, monthly, yearly
- Support both "forever" (no end date) and "until date" modes
- Minimize changes to existing query paths — instances are normal todos
- Provide intuitive delete/edit behavior with scope choices (this one / this and future / all)

## Non-Goals

- Complex recurrence rules (e.g., "every 2nd Tuesday", "every 3 days")
- Recurring todos without a start date (unscheduled)

## Data Model

### New table: `recurring_templates`

| Column | Type | Description |
|--------|------|-------------|
| `id` | text, PK | Template ID (UUID) |
| `title` | text, NOT NULL | Template title |
| `frequency` | text, NOT NULL | `daily` \| `weekly` \| `monthly` \| `yearly` |
| `startDate` | text, NOT NULL | First occurrence (YYYY-MM-DD) |
| `endDate` | text, nullable | Last occurrence; null = forever |
| `generatedUntil` | text, NOT NULL | Date up to which instances have been generated |
| `createdAt` | text, NOT NULL | ISO timestamp |
| `updatedAt` | text, NOT NULL | ISO timestamp |

Tags are not stored on the template. Instead, tags are applied to each generated instance via the existing `todoTags` junction table, keeping the tag system unchanged.

### Modified table: `todos`

Add one nullable column:

| Column | Type | Description |
|--------|------|-------------|
| `recurringId` | text, nullable | FK → `recurring_templates.id`, ON DELETE CASCADE |

Regular todos have `recurringId = null`. Recurring instances point to their template.

## Instance Generation

### On creation

When a user creates a recurring todo:

1. Insert a `recurring_templates` row.
2. Compute all occurrence dates from `startDate` to either `endDate` or `startDate + 20 years` (whichever is sooner).
3. Batch-insert one `todos` row per occurrence date, each with `recurringId` pointing to the template.
4. Apply the selected tags to every generated instance via `todoTags`.
5. Set `generatedUntil` to the last generated date.

### Date calculation rules

| Frequency | Rule | Example (start: 2026-03-28) |
|-----------|------|----------------------------|
| `daily` | Every day | 2026-03-28, 2026-03-29, 2026-03-30, … |
| `weekly` | Same weekday each week | Every Saturday (2026-04-04, 2026-04-11, …) |
| `monthly` | Same day-of-month | 28th of each month. If month has fewer days, use last day of month (e.g., Feb 28) |
| `yearly` | Same month and day | Every Mar 28. For Feb 29 start, use Feb 28 in non-leap years |

### Renewal

To handle the "forever" case beyond the initial 20-year window:

- **Trigger 1 — Reminder cron:** Each time the reminder cron fires, check all templates where `endDate IS NULL` and `generatedUntil` is less than 1 year from today. If so, extend by another 20 years.
- **Trigger 2 — Calendar browsing:** When `getDatesWithTodos(yearMonth)` is called for a month beyond `generatedUntil` for any template, generate instances up to that month + 20 years.

No additional scheduled jobs are needed; these piggyback on existing code paths.

## Existing Query Compatibility

Because instances are regular `todos` rows with a `date`, the following queries require **zero changes**:

| Query | Why it works |
|-------|-------------|
| `getTodosByDate(date)` | Instances have `date = YYYY-MM-DD` |
| `getOverdueTodos(today)` | Instances have `date < today AND completed = 0` |
| `getUpcomingDates(today)` | Instances have future dates |
| `getDatesWithTodos(yearMonth)` | Instances have dates in that month |
| `getUncompletedTodosByDate(date)` | Same as getTodosByDate filter |
| `getTodosByTag(tagId)` | Instances have tags via `todoTags` |
| `getUnscheduledTodos()` | Instances always have a date, so they never appear here |
| Reminder trigger | Queries `getUncompletedTodosByDate` — works as-is |
| Right sidebar (overdue, upcoming, counts) | Calls the above functions — works as-is |
| MCP `todo_list` | Proxies to the above functions — works as-is |

## User Operations

### Complete

No scope choice needed. Marks only the current instance `completed = 1`. Other instances are unaffected.

### Delete

Show a three-option dialog:

| Option | Behavior |
|--------|----------|
| **仅删除此天** | Delete this one instance only |
| **删除此天及未来所有** | Delete all instances with `date >= this date` for this `recurringId`. Update template `endDate` to the day before this date. If this date equals `startDate`, delete the template entirely. |
| **删除整个重复** | Delete the template (CASCADE deletes all instances) |

### Edit title

Show a three-option dialog:

| Option | Behavior |
|--------|----------|
| **仅修改此天** | Update title on this one instance only |
| **修改此天及未来所有** | Update template title. Update title on all instances with `date >= this date` and `completed = 0` for this `recurringId`. |
| **修改所有** | Update template title. Update title on all instances with `completed = 0` for this `recurringId`. |

### Change date (on a single instance)

No scope choice. Detaches this instance from the series:

1. Set `recurringId = null` on this instance.
2. Update `date` to the new date.

The instance becomes a standalone todo. The gap in the series is intentional — the user explicitly moved this one.

### Change tags (on a single instance)

Same as change date — detaches from series. If the user wants to change tags for all, they should do it from a "manage recurring" entry point (future enhancement).

## UI Changes

### TodoCreate component

- Add a "重复" (Repeat) selector: 不重复 / 每天 / 每周 / 每月 / 每年
- When a repeat option is selected, show an optional end date picker ("结束日期")
- When repeat is selected, a start date is required (disable the "no date" state)

### TodoItem component

- Show a small repeat icon (↻) next to the date chip for instances where `recurringId` is not null
- On delete: if `recurringId` is not null, show three-option dialog instead of direct delete
- On title edit: if `recurringId` is not null, show three-option dialog before saving

### New component: RecurringScopeDialog

A reusable dialog/modal with three radio options + confirm/cancel. Used by both delete and edit-title flows. Props:

- `mode`: `'delete' | 'edit'` (controls labels)
- `onConfirm(scope: 'this' | 'thisAndFuture' | 'all')`: callback
- `onCancel`: callback

## MCP Changes

### `todo_create`

Add optional parameters:

- `frequency`: `'daily' | 'weekly' | 'monthly' | 'yearly'`
- `endDate`: optional string (YYYY-MM-DD)

When `frequency` is provided, creates a recurring template + instances instead of a single todo.

### `todo_delete`

Add optional parameter:

- `scope`: `'this' | 'thisAndFuture' | 'all'` (default: `'this'` for recurring, ignored for regular todos)

### `todo_update`

Add optional parameter:

- `scope`: `'this' | 'thisAndFuture' | 'all'` (default: `'this'` for recurring, ignored for regular todos)

## API Route Changes

### POST `/api/todos`

Accept optional `frequency` and `endDate` fields. When present, create template + instances.

### DELETE `/api/todos/[id]`

Accept optional `scope` query parameter. When the todo has `recurringId` and scope is provided, apply the scoped delete logic.

### PATCH `/api/todos/[id]`

Accept optional `scope` body field. When the todo has `recurringId` and scope is provided, apply the scoped update logic.

## Edge Cases

| Case | Handling |
|------|----------|
| Monthly repeat on 31st, month has 30 days | Use last day of month (30th) |
| Monthly repeat on 29th, February non-leap | Use Feb 28 |
| Yearly repeat on Feb 29 | Use Feb 28 in non-leap years |
| Delete "this and future" on the start date | Delete template + all instances (same as "delete all") |
| Edit title "this and future" on the start date | Same as "modify all" |
| User changes date of a recurring instance | Detach from series (set `recurringId = null`) |
| Template with endDate in the past | No active instances; template remains for history. User can delete manually. |

## Performance Considerations

- **Batch insert:** Use a single transaction for generating all instances (up to ~7,300 for daily/20yr). SQLite handles this in under a second.
- **Batch update/delete:** Scoped operations use `WHERE recurringId = ? AND date >= ?`, which is efficient with an index on `(recurringId, date)`.
- **Index:** Add a composite index on `todos(recurringId, date)` for efficient scoped queries.

## Migration

- Add `recurringId` column to `todos` table (nullable, no impact on existing data).
- Create `recurring_templates` table.
- Add index on `todos(recurringId, date)`.
- Run via `npm run db:push`.
