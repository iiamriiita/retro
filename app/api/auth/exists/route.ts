import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Returns whether a COMPLETED account exists for the given email, so the
// sign-up flow can tell people to log in instead of registering again.
// Registration counts as complete only once a password has been set
// (user_metadata.pw_set, stamped in AuthModal's savePassword step).
// Half-finished accounts — OTP requested or even verified, but no password —
// are treated as not registered, so re-running sign-up simply re-sends a
// code and lets the person finish, instead of dead-ending at a password
// login they never created. Legacy accounts without the stamp heal the same
// way: OTP re-proves email ownership, then the password step adds the stamp.
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
    if (
      users.some(
        (u) =>
          (u.email ?? "").toLowerCase() === target &&
          u.user_metadata?.pw_set === true,
      )
    )
      return NextResponse.json({ exists: true });
    if (users.length < perPage) break;
  }
  return NextResponse.json({ exists: false });
}
