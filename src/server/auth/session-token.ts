import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function signExpiresAt(passwordHash: string, expiresAt: string) {
  return createHmac("sha256", passwordHash).update(expiresAt).digest("hex");
}

export function createSignedSessionToken(passwordHash: string, now = Date.now()): string {
  const expiresAt = String(now + SESSION_TTL_MS);
  const signature = signExpiresAt(passwordHash, expiresAt);
  return `${expiresAt}.${signature}`;
}

export function validateSignedSessionToken(
  token: string,
  passwordHash: string,
  now = Date.now(),
): boolean {
  const [expiresAt, signature] = token.split(".");

  if (!expiresAt || !signature) {
    return false;
  }

  const expiry = Number(expiresAt);

  if (!Number.isFinite(expiry) || expiry <= now) {
    return false;
  }

  const expectedSignature = signExpiresAt(passwordHash, expiresAt);
  const provided = Buffer.from(signature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}
