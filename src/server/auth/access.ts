interface ProxyAuthDecisionInput {
  pathname: string;
  authEnabled: boolean;
  sessionToken?: string;
  sessionValid: boolean;
  noAuthCookie?: string;
}

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/reminders/trigger"];

export function getProxyAuthDecision({
  pathname,
  authEnabled,
  sessionToken,
  sessionValid,
}: ProxyAuthDecisionInput): "allow" | "redirect-login" {
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return "allow";
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return "allow";
  }

  if (!authEnabled) {
    return "allow";
  }

  if (!sessionToken || !sessionValid) {
    return "redirect-login";
  }

  return "allow";
}
