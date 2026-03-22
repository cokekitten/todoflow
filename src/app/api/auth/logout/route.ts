import { NextRequest, NextResponse } from "next/server";

import { clearSession } from "@/server/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  if (token) {
    clearSession(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("session");
  return response;
}
