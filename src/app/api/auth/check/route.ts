import { NextResponse } from "next/server";

import { isAuthEnabled } from "@/server/auth";

export async function GET() {
  const authRequired = isAuthEnabled();
  const response = NextResponse.json({ authRequired });

  if (!authRequired) {
    response.cookies.set("no-auth", "true", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });
  } else {
    response.cookies.delete("no-auth");
  }

  return response;
}
