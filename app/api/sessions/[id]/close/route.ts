import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnerCookie } from "@/lib/owner";

export const runtime = "nodejs";

// Only the owner (holding the owner-token cookie) may close a session.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = createServiceClient();
  const { data: session, error } = await supabase
    .from("retro_sessions")
    .select("id, owner_token, status")
    .eq("id", id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cookieToken = await getOwnerCookie(id);
  if (!cookieToken || cookieToken !== session.owner_token) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (session.status === "closed") {
    return NextResponse.json({ ok: true });
  }

  const { error: updateError } = await supabase
    .from("retro_sessions")
    .update({ status: "closed" })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Could not close" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
