import { eq } from "drizzle-orm";

import { db } from "../db";
import { settings } from "../db/schema";

export function getSetting(key: string): string | null {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row?.value ?? null;
}

export function setSetting(key: string, value: string | null): void {
  const existing = db.select().from(settings).where(eq(settings.key, key)).get();
  const now = new Date().toISOString();

  if (existing) {
    db.update(settings).set({ value, updatedAt: now }).where(eq(settings.key, key)).run();
    return;
  }

  db.insert(settings).values({ key, value, updatedAt: now }).run();
}

export function getAllSettings(): Record<string, string | null> {
  const rows = db.select().from(settings).all();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export function getTelegramConfig() {
  return {
    botToken: getSetting("telegram_bot_token") || process.env.TELEGRAM_BOT_TOKEN || null,
    chatId: getSetting("telegram_chat_id") || process.env.TELEGRAM_CHAT_ID || null,
  };
}

export function getReminderTimes() {
  return {
    dayBefore: getSetting("reminder_time_day_before") || "20:00",
    sameDay: getSetting("reminder_time_same_day") || "08:00",
  };
}

export function getPasswordHash(): string | null {
  return getSetting("password_hash");
}
