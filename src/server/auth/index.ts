import bcrypt from "bcrypt";

import { getPasswordHash, setSetting } from "../settings";
import { createSignedSessionToken, validateSignedSessionToken } from "./session-token";

export function isAuthEnabled(): boolean {
  const hash = getPasswordHash();
  return Boolean(hash && hash.length > 0);
}

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = getPasswordHash();

  if (!hash) {
    return true;
  }

  return bcrypt.compare(password, hash);
}

export async function setPassword(newPassword: string): Promise<void> {
  if (newPassword === "") {
    setSetting("password_hash", null);
    return;
  }

  const hash = await bcrypt.hash(newPassword, 10);
  setSetting("password_hash", hash);
}

export function createSession(): string {
  const hash = getPasswordHash();

  if (!hash) {
    throw new Error("Cannot create session without configured password");
  }

  return createSignedSessionToken(hash);
}

export function validateSession(token: string): boolean {
  const hash = getPasswordHash();

  if (!hash) {
    return false;
  }

  return validateSignedSessionToken(token, hash);
}

export function clearSession(): void {
}
