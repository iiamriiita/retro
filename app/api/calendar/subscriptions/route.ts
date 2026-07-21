import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requirePin } from "@/lib/calendar/server";

export const runtime = "nodejs";

// POST /api/calendar/subscriptions — 儲存(或更新)一支手機的推播訂閱
export async function POST(req: Request) {
  const denied = requirePin(req);
  if (denied) return denied;

  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  const endpoint = body.endpoint ?? "";
  const p256dh = body.keys?.p256dh ?? "";
  const auth = body.keys?.auth ?? "";
  if (!endpoint.startsWith("https://") || !p256dh || !auth) {
    return NextResponse.json({ error: "訂閱資料不完整" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("calendar_push_subscriptions")
    .upsert({ endpoint, p256dh, auth }, { onConflict: "endpoint" });

  if (error) {
    return NextResponse.json({ error: "儲存失敗" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/calendar/subscriptions  { endpoint }
export async function DELETE(req: Request) {
  const denied = requirePin(req);
  if (denied) return denied;

  let body: { endpoint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }
  if (!body.endpoint) {
    return NextResponse.json({ error: "缺少 endpoint" }, { status: 400 });
  }

  const supabase = createServiceClient();
  await supabase
    .from("calendar_push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint);
  return NextResponse.json({ ok: true });
}
