import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isAuthEnabled, validateSession } from "@/server/auth";
import { getProxyAuthDecision } from "@/server/auth/access";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get("session")?.value;
  const decision = getProxyAuthDecision({
    pathname,
    authEnabled: isAuthEnabled(),
    sessionToken,
    sessionValid: sessionToken ? validateSession(sessionToken) : false,
    noAuthCookie: request.cookies.get("no-auth")?.value,
  });

  if (decision === "redirect-login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
