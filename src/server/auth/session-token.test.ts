import assert from "node:assert/strict";
import test from "node:test";

import {
  createSignedSessionToken,
  SESSION_TTL_MS,
  validateSignedSessionToken,
} from "./session-token";

const PASSWORD_HASH = "$2b$10$examplepasswordhashfortestsessiontokenvalue12345";

test("creates a token that validates with the same password hash", () => {
  const now = 1_700_000_000_000;
  const token = createSignedSessionToken(PASSWORD_HASH, now);

  assert.equal(validateSignedSessionToken(token, PASSWORD_HASH, now + 1_000), true);
});

test("rejects a token if the password hash changes", () => {
  const token = createSignedSessionToken(PASSWORD_HASH, 1_700_000_000_000);

  assert.equal(
    validateSignedSessionToken(token, "$2b$10$differentpasswordhashfortestsessiontokenvalue1234", 1_700_000_001_000),
    false,
  );
});

test("rejects an expired token", () => {
  const now = 1_700_000_000_000;
  const token = createSignedSessionToken(PASSWORD_HASH, now);

  assert.equal(validateSignedSessionToken(token, PASSWORD_HASH, now + SESSION_TTL_MS + 1), false);
});

test("rejects a tampered token", () => {
  const token = createSignedSessionToken(PASSWORD_HASH, 1_700_000_000_000);
  const [expiresAt, signature] = token.split(".");
  const tampered = `${expiresAt}.${signature?.slice(0, -1)}x`;

  assert.equal(validateSignedSessionToken(tampered, PASSWORD_HASH, 1_700_000_001_000), false);
});
