import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Returns whether an account already exists for the given email. Used by the
// sign-up flow so we can tell people to log in instead of registering again.
export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  const target = (email ?? "").trim().toLowerCase();
  if (!target) return NextResponse.json({ exists: false });

  const supabase = createServiceClient();
  const perPage = 200;
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) return NextResponse.json({ exists: false });
    const users = data?.users ?? [];
    if (users.some((u) => (u.email ?? "").toLowerCase() === target))
      return NextResponse.json({ exists: true });
    if (users.length < perPage) break;
  }
  return NextResponse.json({ exists: false });
}
