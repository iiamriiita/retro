import { NextResponse } from "next/server";
import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/server";
import { formatDateLabel, formatTimeLabel, relativeDayLabel } from "@/lib/calendar/parse";
import type { CalendarEvent } from "@/lib/calendar/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/calendar/cron — 由外部排程(cron-job.org / Vercel Cron / pg_cron)
// 每幾分鐘打一次:找出「提醒時間到了、還沒提醒過」的事件,推播給所有訂閱的手機。
// 驗證:Authorization: Bearer <CRON_SECRET> 或 ?key=<CRON_SECRET>。
export async function GET(req: Request) {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 500 });
  }
  const url = new URL(req.url);
  const given =
    (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "") ||
    (url.searchParams.get("key") ?? "");
  if (given !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const publicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY ?? "").trim();
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: "VAPID keys not set" }, { status: 500 });
  }
  webpush.setVapidDetails(
    (process.env.VAPID_SUBJECT ?? "mailto:admin@example.com").trim(),
    publicKey,
    privateKey,
  );

  const supabase = createServiceClient();
  const now = new Date();
  // 超過 24 小時的舊提醒不補發(伺服器停擺太久時避免轟炸)
  const floor = new Date(now.getTime() - 24 * 3600 * 1000);

  const { data: due, error } = await supabase
    .from("calendar_events")
    .select("id, title, event_date, event_time, remind_at, reminded_at, created_at")
    .is("reminded_at", null)
    .not("remind_at", "is", null)
    .lte("remind_at", now.toISOString())
    .gte("remind_at", floor.toISOString());
  if (error) {
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }
  if (!due || due.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const { data: subs } = await supabase
    .from("calendar_push_subscriptions")
    .select("endpoint, p256dh, auth");

  let sent = 0;
  const dead: string[] = [];

  for (const event of due as CalendarEvent[]) {
    const day = relativeDayLabel(event.event_date, now) ?? formatDateLabel(event.event_date);
    const time = event.event_time
      ? formatTimeLabel(event.event_time.slice(0, 5))
      : "";
    const payload = JSON.stringify({
      title: `📅 ${event.title}`,
      body: `${day}${time ? ` ${time}` : ""},別忘記囉!`,
      url: "/calendar",
    });

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        // 404/410 = 訂閱已失效(換手機、刪掉 app)→ 清掉
        if (status === 404 || status === 410) dead.push(sub.endpoint);
        else console.error("push failed", status);
      }
    }

    await supabase
      .from("calendar_events")
      .update({ reminded_at: now.toISOString() })
      .eq("id", event.id);
  }

  if (dead.length > 0) {
    await supabase
      .from("calendar_push_subscriptions")
      .delete()
      .in("endpoint", dead);
  }

  return NextResponse.json({ sent, events: due.length, pruned: dead.length });
}
