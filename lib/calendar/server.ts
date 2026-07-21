// 行事曆 API 共用的伺服器端小工具。

import { NextResponse } from "next/server";

/**
 * 可選的家用 PIN 鎖。設定 CALENDAR_PIN 環境變數後,所有 /api/calendar/*
 * 請求都必須帶相同的 x-calendar-pin header;沒設定就完全開放。
 */
export function requirePin(req: Request): NextResponse | null {
  const pin = (process.env.CALENDAR_PIN ?? "").trim();
  if (!pin) return null;
  if ((req.headers.get("x-calendar-pin") ?? "") === pin) return null;
  return NextResponse.json({ error: "需要通行碼" }, { status: 401 });
}

export const EVENT_SELECT =
  "id, title, event_date, event_time, remind_at, reminded_at, created_at";
