import test from "node:test";
import assert from "node:assert/strict";

import { getProxyAuthDecision } from "./access";

test("allows public auth and login routes", () => {
  assert.equal(
    getProxyAuthDecision({
      pathname: "/login",
      authEnabled: true,
      sessionToken: undefined,
      sessionValid: false,
    }),
    "allow",
  );
});

test("allows protected routes when auth is disabled", () => {
  assert.equal(
    getProxyAuthDecision({
      pathname: "/date/2026-03-22",
      authEnabled: false,
      sessionToken: undefined,
      sessionValid: false,
    }),
    "allow",
  );
});

test("redirects protected routes when auth is enabled and there is no valid session", () => {
  assert.equal(
    getProxyAuthDecision({
      pathname: "/settings",
      authEnabled: true,
      sessionToken: undefined,
      sessionValid: false,
      noAuthCookie: "true",
    }),
    "redirect-login",
  );
});

test("allows protected routes when auth is enabled and session is valid", () => {
  assert.equal(
    getProxyAuthDecision({
      pathname: "/settings",
      authEnabled: true,
      sessionToken: "session-token",
      sessionValid: true,
    }),
    "allow",
  );
});
