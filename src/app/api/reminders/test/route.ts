import { NextResponse } from "next/server";

import { sendTestNotification } from "@/server/reminders";

export async function POST() {
  const result = await sendTestNotification();
  return NextResponse.json(result);
}
