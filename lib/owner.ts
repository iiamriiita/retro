import { cookies } from "next/headers";
import { nanoid } from "nanoid";

// Per-session owner token, stored in an httpOnly cookie. Lets us authenticate
// "I am the person who started this session" without any login. One cookie per
// session so a single browser can own several sessions.

const COOKIE_PREFIX = "retro_owner_";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function ownerCookieName(sessionId: string) {
  return `${COOKIE_PREFIX}${sessionId}`;
}

export function newOwnerToken(): string {
  return nanoid(32);
}

// Persist the owner token for a session (called right after creation).
export async function setOwnerCookie(sessionId: string, token: string) {
  const store = await cookies();
  store.set(ownerCookieName(sessionId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

// Read the owner token this browser holds for a session (if any).
export async function getOwnerCookie(sessionId: string): Promise<string | null> {
  const store = await cookies();
  return store.get(ownerCookieName(sessionId))?.value ?? null;
}
