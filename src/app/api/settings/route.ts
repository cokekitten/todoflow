import { NextRequest, NextResponse } from "next/server";

import { setPassword } from "@/server/auth";
import { getAllSettings, setSetting } from "@/server/settings";

const ALLOWED_KEYS = [
  "telegram_bot_token",
  "telegram_chat_id",
  "reminder_time_day_before",
  "reminder_time_same_day",
] as const;

export async function GET() {
  const all = getAllSettings();
  const { password_hash, ...safe } = all;

  return NextResponse.json({
    ...safe,
    hasPassword: Boolean(password_hash),
  });
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as Record<string, string | null>;

  for (const key of ALLOWED_KEYS) {
    if (key in body) {
      setSetting(key, body[key] ?? null);
    }
  }

  if ("password" in body) {
    await setPassword(body.password ?? "");
  }

  const response = NextResponse.json({ ok: true });

  if ("password" in body) {
    if (body.password) {
      response.cookies.delete("no-auth");
      response.cookies.delete("session");
    } else {
      response.cookies.set("no-auth", "true", {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 86400,
        path: "/",
      });
    }
  }

  return response;
}
