import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

import { getPasswordHash, setSetting } from "../settings";

const sessions = new Map<string, { createdAt: number }>();
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
    sessions.clear();
    return;
  }

  const hash = await bcrypt.hash(newPassword, 10);
  setSetting("password_hash", hash);
  sessions.clear();
}

export function createSession(): string {
  const token = uuidv4();
  sessions.set(token, { createdAt: Date.now() });
  return token;
}

export function validateSession(token: string): boolean {
  const session = sessions.get(token);

  if (!session) {
    return false;
  }

  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(token);
    return false;
  }

  return true;
}

export function clearSession(token: string): void {
  sessions.delete(token);
}
