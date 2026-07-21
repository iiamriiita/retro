import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requirePin, EVENT_SELECT } from "@/lib/calendar/server";
import type { NewCalendarEvent } from "@/lib/calendar/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/calendar/events?from=YYYY-MM-DD&to=YYYY-MM-DD(範圍可省略)
export async function GET(req: Request) {
  const denied = requirePin(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = createServiceClient();
  let query = supabase
    .from("calendar_events")
    .select(EVENT_SELECT)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true, nullsFirst: true });
  if (from) query = query.gte("event_date", from);
  if (to) query = query.lte("event_date", to);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "讀取失敗" }, { status: 500 });
  }
  return NextResponse.json({ events: data ?? [] });
}

// POST /api/calendar/events  { title, event_date, event_time?, remind_at?, raw_input? }
export async function POST(req: Request) {
  const denied = requirePin(req);
  if (denied) return denied;

  let body: NewCalendarEvent;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(body.event_date ?? "")) {
    return NextResponse.json({ error: "缺少標題或日期" }, { status: 400 });
  }
  if (body.event_time && !/^\d{2}:\d{2}$/.test(body.event_time)) {
    return NextResponse.json({ error: "時間格式錯誤" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      title: title.slice(0, 200),
      event_date: body.event_date,
      event_time: body.event_time || null,
      remind_at: body.remind_at || null,
      raw_input: (body.raw_input ?? "").slice(0, 500) || null,
    })
    .select(EVENT_SELECT)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "儲存失敗" }, { status: 500 });
  }
  return NextResponse.json({ event: data });
}
