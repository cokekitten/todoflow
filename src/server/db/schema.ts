import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

export const todos = sqliteTable("todos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  completed: integer("completed").default(0).notNull(),
  date: text("date"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
  recurringId: text("recurring_id").references(() => recurringTemplates.id, { onDelete: "cascade" }),
}, (table) => [
  index("idx_todos_date").on(table.date),
  index("idx_todos_recurring_date").on(table.recurringId, table.date),
]);

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").unique().notNull(),
  color: text("color"),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const todoTags = sqliteTable(
  "todo_tags",
  {
    todoId: text("todo_id")
      .notNull()
      .references(() => todos.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.todoId, table.tagId] })],
);

export const todoSortContexts = sqliteTable(
  "todo_sort_contexts",
  {
    contextKey: text("context_key").notNull(),
    todoId: text("todo_id")
      .notNull()
      .references(() => todos.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [primaryKey({ columns: [table.contextKey, table.todoId] })],
);

export const reminderLogs = sqliteTable("reminder_logs", {
  id: text("id").primaryKey(),
  targetDate: text("target_date").notNull(),
  remindType: text("remind_type").notNull(),
  sentAt: text("sent_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});
