import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getLocale } from "@/lib/i18n/server";

export const runtime = "nodejs";

// Owner-only: delete a retro and all of its data (answers, participants,
// comments). Children are removed explicitly so it works with or without
// ON DELETE CASCADE on the foreign keys.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const en = (await getLocale()) === "en";
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { error: en ? "Please log in first" : "請先登入" },
      { status: 401 },
    );

  const supabase = createServiceClient();
  const { data: session } = await supabase
    .from("retro_sessions")
    .select("id, owner_id")
    .eq("id", id)
    .single();
  if (!session) return NextResponse.json({ ok: true }); // already gone
  if (session.owner_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await supabase.from("retro_comments").delete().eq("session_id", id);
  await supabase.from("retro_answers").delete().eq("session_id", id);
  await supabase.from("retro_participants").delete().eq("session_id", id);
  const { error } = await supabase.from("retro_sessions").delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: en ? "Couldn't delete" : "刪除失敗" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
