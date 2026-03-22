import { NextRequest, NextResponse } from "next/server";

import { createSession, isAuthEnabled, verifyPassword } from "@/server/auth";

export async function POST(request: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ ok: true, message: "No password set" });
  }

  const body = (await request.json()) as { password?: string };
  const password = body.password?.trim();

  if (!password) {
    return NextResponse.json({ ok: false, error: "Password required" }, { status: 400 });
  }

  const valid = await verifyPassword(password);

  if (!valid) {
    return NextResponse.json({ ok: false, error: "密码错误" }, { status: 401 });
  }

  const token = createSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  response.cookies.delete("no-auth");

  return response;
}
