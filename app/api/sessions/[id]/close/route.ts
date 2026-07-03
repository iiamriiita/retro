import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getLocale } from "@/lib/i18n/server";

export const runtime = "nodejs";

// Only the owner (the logged-in account that created the session) may close it.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    const en = (await getLocale()) === "en";
    return NextResponse.json(
      { error: en ? "Please log in first" : "請先登入" },
      { status: 401 },
    );
  }

  const supabase = createServiceClient();
  const { data: session, error } = await supabase
    .from("retro_sessions")
    .select("id, owner_id, status")
    .eq("id", id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.owner_id !== user.id) {
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
