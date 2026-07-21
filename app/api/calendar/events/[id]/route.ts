import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requirePin, EVENT_SELECT } from "@/lib/calendar/server";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/calendar/events/:id  { title?, event_date?, event_time?, remind_at? }
export async function PATCH(req: Request, { params }: Params) {
  const denied = requirePin(req);
  if (denied) return denied;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) {
    patch.title = body.title.trim().slice(0, 200);
  }
  if (typeof body.event_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.event_date)) {
    patch.event_date = body.event_date;
  }
  if ("event_time" in body) {
    patch.event_time =
      typeof body.event_time === "string" && /^\d{2}:\d{2}$/.test(body.event_time)
        ? body.event_time
        : null;
  }
  if ("remind_at" in body) {
    patch.remind_at = typeof body.remind_at === "string" ? body.remind_at : null;
    patch.reminded_at = null; // 提醒時間改了 → 重新提醒
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "沒有可更新的欄位" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .update(patch)
    .eq("id", id)
    .select(EVENT_SELECT)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
  return NextResponse.json({ event: data });
}

// DELETE /api/calendar/events/:id
export async function DELETE(req: Request, { params }: Params) {
  const denied = requirePin(req);
  if (denied) return denied;
  const { id } = await params;

  const supabase = createServiceClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "刪除失敗" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
