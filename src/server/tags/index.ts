import { asc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { db } from "../db";
import { tags } from "../db/schema";

export interface CreateTagInput {
  name: string;
  color?: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
  sortOrder?: number;
}

export function getAllTags() {
  return db.select().from(tags).orderBy(asc(tags.sortOrder), asc(tags.name)).all();
}

export function getTagById(id: string) {
  return db.select().from(tags).where(eq(tags.id, id)).get() ?? null;
}

export function createTag(input: CreateTagInput) {
  const id = uuidv4();

  const existingTags = getAllTags();
  existingTags.forEach((tag, index) => {
    db.update(tags).set({ sortOrder: index + 1 }).where(eq(tags.id, tag.id)).run();
  });

  db.insert(tags)
    .values({
      id,
      name: input.name,
      color: input.color ?? "#7c3aed",
      sortOrder: 0,
    })
    .run();

  return getTagById(id)!;
}

export function updateTag(id: string, input: UpdateTagInput) {
  const existing = getTagById(id);

  if (!existing) {
    return null;
  }

  const updates: Partial<typeof tags.$inferInsert> = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.color !== undefined) updates.color = input.color;
  if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;

  db.update(tags).set(updates).where(eq(tags.id, id)).run();

  return getTagById(id)!;
}

export function deleteTag(id: string): boolean {
  const result = db.delete(tags).where(eq(tags.id, id)).run();
  return result.changes > 0;
}
