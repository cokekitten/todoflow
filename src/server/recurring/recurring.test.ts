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

afterEach(() => {
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

  const instances = db.select().from(todos).where(eq(todos.recurringId, result.templateId)).all();
  assert.equal(instances.length, 5);
});

test("createRecurringTodo: daily without endDate generates 20 years", () => {
  const result = createRecurringTodo({
    title: "Drink water",
    frequency: "daily",
    startDate: "2026-03-28",
  });

  const instances = db.select().from(todos).where(eq(todos.recurringId, result.templateId)).all();
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

  const instances = db.select().from(todos).where(eq(todos.recurringId, result.templateId)).all();
  const targetInstance = instances.find((i) => i.date === "2026-03-30")!;

  deleteRecurringScoped(targetInstance.id, "this");

  const remaining = db.select().from(todos).where(eq(todos.recurringId, result.templateId)).all();
  assert.equal(remaining.length, 4);
  assert.ok(!remaining.some((i) => i.date === "2026-03-30"));
});

test("deleteRecurringScoped: 'thisAndFuture' deletes from date onward and updates template", () => {
  const result = createRecurringTodo({
    title: "Test",
    frequency: "daily",
    startDate: "2026-03-28",
    endDate: "2026-04-01",
  });

  const instances = db.select().from(todos).where(eq(todos.recurringId, result.templateId)).all();
  const targetInstance = instances.find((i) => i.date === "2026-03-30")!;

  deleteRecurringScoped(targetInstance.id, "thisAndFuture");

  const remaining = db.select().from(todos).where(eq(todos.recurringId, result.templateId)).all();
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

  const instances = db.select().from(todos).where(eq(todos.recurringId, result.templateId)).all();
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

  const instances = db.select().from(todos).where(eq(todos.recurringId, result.templateId)).all();
  deleteRecurringScoped(instances[0].id, "all");

  const remaining = db.select().from(todos).where(eq(todos.recurringId, result.templateId)).all();
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

  const instances = db.select().from(todos).where(eq(todos.recurringId, result.templateId)).all();
  const target = instances.find((i) => i.date === "2026-03-29")!;

  updateRecurringScoped(target.id, { title: "Changed" }, "this");

  const updated = db.select().from(todos).where(eq(todos.id, target.id)).get()!;
  assert.equal(updated.title, "Changed");

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

  const instances = db.select().from(todos).where(eq(todos.recurringId, result.templateId)).all();
  const target = instances.find((i) => i.date === "2026-03-30")!;

  updateRecurringScoped(target.id, { title: "New title" }, "thisAndFuture");

  const template = getTemplateById(result.templateId)!;
  assert.equal(template.title, "New title");

  const all = db.select().from(todos).where(eq(todos.recurringId, result.templateId)).all();
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

  const instances = db.select().from(todos).where(eq(todos.recurringId, result.templateId)).all();
  updateRecurringScoped(instances[0].id, { title: "All changed" }, "all");

  const all = db.select().from(todos).where(eq(todos.recurringId, result.templateId)).all();
  for (const inst of all) {
    assert.equal(inst.title, "All changed");
  }
});
