import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { renewTemplates } from "../recurring";

import { db } from "../db";
import { reminderLogs } from "../db/schema";
import { getReminderTimes, getTelegramConfig } from "../settings";
import { getUncompletedTodosByDate, type TodoWithTags } from "../todos";
import { sendTelegramMessage } from "../telegram";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAYS[date.getDay()]}`;
}

function buildSummaryMessage(prefix: string, dateStr: string, todos: TodoWithTags[]): string {
  const lines: string[] = [`📋 ${prefix} | ${formatDate(dateStr)}`, ""];
  const grouped = new Map<string, TodoWithTags[]>();
  const untagged: TodoWithTags[] = [];

  for (const todo of todos) {
    if (todo.tags.length === 0) {
      untagged.push(todo);
      continue;
    }

    for (const tag of todo.tags) {
      if (!grouped.has(tag.name)) {
        grouped.set(tag.name, []);
      }

      grouped.get(tag.name)?.push(todo);
    }
  }

  for (const [tagName, tagTodos] of grouped) {
    lines.push(`【${tagName}】`);
    for (const todo of tagTodos) {
      lines.push(`  □ ${todo.title}`);
    }
    lines.push("");
  }

  if (untagged.length > 0) {
    lines.push("【其他】");
    for (const todo of untagged) {
      lines.push(`  □ ${todo.title}`);
    }
    lines.push("");
  }

  lines.push(`共 ${todos.length} 项未完成`);

  return lines.join("\n");
}

function hasBeenSent(targetDate: string, remindType: string): boolean {
  const row = db
    .select()
    .from(reminderLogs)
    .where(and(eq(reminderLogs.targetDate, targetDate), eq(reminderLogs.remindType, remindType)))
    .get();

  return Boolean(row);
}

function logSent(targetDate: string, remindType: string): void {
  db.insert(reminderLogs)
    .values({
      id: uuidv4(),
      targetDate,
      remindType,
      sentAt: new Date().toISOString(),
    })
    .run();
}

function isWithinWindow(configuredTime: string, now: Date): boolean {
  const [hours, minutes] = configuredTime.split(":").map(Number);
  const targetMinutes = hours * 60 + minutes;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return Math.abs(currentMinutes - targetMinutes) <= 30;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateString(date: Date, offsetDays = 0): string {
  const next = new Date(date);
  next.setDate(next.getDate() + offsetDays);
  return formatLocalDate(next);
}

export interface TriggerResult {
  sent: { type: string; date: string }[];
  skipped: { type: string; date: string; reason: string }[];
  errors: { type: string; date: string; error: string }[];
}

export async function triggerReminders(): Promise<TriggerResult> {
  const config = getTelegramConfig();
  const times = getReminderTimes();
  const now = new Date();
  const today = getDateString(now);
  const tomorrow = getDateString(now, 1);
  const result: TriggerResult = { sent: [], skipped: [], errors: [] };

  try {
    renewTemplates();
  } catch {
    // Non-critical — don't block reminder delivery
  }

  if (!config.botToken || !config.chatId) {
    result.errors.push({ type: "config", date: "", error: "Telegram not configured" });
    return result;
  }

  if (isWithinWindow(times.dayBefore, now)) {
    if (hasBeenSent(tomorrow, "day_before")) {
      result.skipped.push({ type: "day_before", date: tomorrow, reason: "already sent" });
    } else {
      const todos = getUncompletedTodosByDate(tomorrow);

      if (todos.length === 0) {
        result.skipped.push({ type: "day_before", date: tomorrow, reason: "no todos" });
      } else {
        const sendResult = await sendTelegramMessage(
          config.botToken,
          config.chatId,
          buildSummaryMessage("明日待办提醒", tomorrow, todos),
        );

        if (sendResult.ok) {
          logSent(tomorrow, "day_before");
          result.sent.push({ type: "day_before", date: tomorrow });
        } else {
          result.errors.push({
            type: "day_before",
            date: tomorrow,
            error: sendResult.error || "send failed",
          });
        }
      }
    }
  }

  if (isWithinWindow(times.sameDay, now)) {
    if (hasBeenSent(today, "same_day")) {
      result.skipped.push({ type: "same_day", date: today, reason: "already sent" });
    } else {
      const todos = getUncompletedTodosByDate(today);

      if (todos.length === 0) {
        result.skipped.push({ type: "same_day", date: today, reason: "no todos" });
      } else {
        const sendResult = await sendTelegramMessage(
          config.botToken,
          config.chatId,
          buildSummaryMessage("今日待办", today, todos),
        );

        if (sendResult.ok) {
          logSent(today, "same_day");
          result.sent.push({ type: "same_day", date: today });
        } else {
          result.errors.push({
            type: "same_day",
            date: today,
            error: sendResult.error || "send failed",
          });
        }
      }
    }
  }

  return result;
}

export async function sendTestNotification(): Promise<{ ok: boolean; error?: string }> {
  const config = getTelegramConfig();

  if (!config.botToken || !config.chatId) {
    return { ok: false, error: "Telegram Bot Token 或 Chat ID 未配置" };
  }

  return sendTelegramMessage(
    config.botToken,
    config.chatId,
    "🔔 TodoFlow 测试通知\n\n如果你看到这条消息，说明 Telegram 通知已配置成功！",
  );
}
