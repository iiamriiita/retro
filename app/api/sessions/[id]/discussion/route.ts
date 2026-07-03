import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";

export const runtime = "nodejs";

// Owner-only: toggle the discussion feature on/off for a closed session.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  let enabled = true;
  try {
    const body = await req.json();
    enabled = body?.enabled !== false;
  } catch {
    /* default true */
  }

  const supabase = createServiceClient();
  const { data: session } = await supabase
    .from("retro_sessions")
    .select("id, owner_id")
    .eq("id", id)
    .single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.owner_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { error } = await supabase
    .from("retro_sessions")
    .update({ discussion_enabled: enabled })
    .eq("id", id);
  if (error) return NextResponse.json({ error: "更新失敗" }, { status: 500 });

  return NextResponse.json({ ok: true, discussion_enabled: enabled });
}
