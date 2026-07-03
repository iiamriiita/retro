import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Auth-aware Supabase client bound to the request cookies. Use this in server
// components and route handlers to read the logged-in user (the organizer).
// Writes are still done with the service-role client after an owner check.
export async function createAuthServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — cookie writes are handled by
            // middleware instead. Safe to ignore.
          }
        },
      },
    },
  );
}

// Convenience: the current user (or null).
export async function getCurrentUser() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
