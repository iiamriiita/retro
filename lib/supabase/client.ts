"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser client using the public ANON key. Used for reading closed-session
// results and Realtime comment threads (Phase 2). Subject to RLS.
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
