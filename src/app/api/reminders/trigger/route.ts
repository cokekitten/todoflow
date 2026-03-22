import { NextRequest, NextResponse } from "next/server";

import { triggerReminders } from "@/server/reminders";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await triggerReminders();
  return NextResponse.json(result);
}
