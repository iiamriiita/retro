import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";

export const runtime = "nodejs";

// Owner-only: choose what the shared results link shows (raw answers or not).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: session } = await supabase
    .from("retro_sessions")
    .select("id, owner_id")
    .eq("id", id)
    .single();
  if (!session)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.owner_id !== user.id)
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    show_raw?: boolean;
  };
  if (typeof body.show_raw !== "boolean")
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { error } = await supabase
    .from("retro_sessions")
    .update({ share_show_raw: body.show_raw })
    .eq("id", session.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
