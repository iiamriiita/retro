"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser client using the public ANON key. Used for auth (magic link), reading
// closed-session results, and Realtime comment threads. Subject to RLS.
// Trim env values defensively — a stray newline/space in the key would make the
// fetch headers invalid ("Failed to execute 'fetch' on 'Window': Invalid value").
export function createBrowserSupabase() {
  return createBrowserClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim(),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim(),
  );
}
