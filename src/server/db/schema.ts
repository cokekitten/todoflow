import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  completed: integer("completed").default(0).notNull(),
  date: text("date"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

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
