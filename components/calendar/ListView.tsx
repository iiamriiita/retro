"use client";

import { useMemo, useState } from "react";
import type { CalendarEvent } from "@/lib/calendar/types";
import { calFetch } from "@/lib/calendar/client";
import { formatDateLabel, formatTimeLabel, relativeDayLabel } from "@/lib/calendar/parse";

const ORANGE = "#e86a33";

/** 單筆事件卡(月曆檢視也共用)。 */
export function EventRow({
  event,
  onDeleted,
  showDate = false,
}: {
  event: CalendarEvent;
  onDeleted: () => void;
  showDate?: boolean;
}) {
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!window.confirm(`要刪除「${event.title}」嗎?`)) return;
    setDeleting(true);
    try {
      await calFetch(`/api/calendar/events/${event.id}`, { method: "DELETE" });
      onDeleted();
    } catch {
      setDeleting(false);
      window.alert("刪除失敗,請再試一次");
    }
  }

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border-2 bg-white p-4"
      style={{ borderColor: "#f0e2d4", opacity: deleting ? 0.5 : 1 }}
    >
      <div className="min-w-0 flex-1">
        {showDate && (
          <p className="text-lg font-semibold" style={{ color: ORANGE }}>
            {relativeDayLabel(event.event_date) ?? ""}
            {formatDateLabel(event.event_date)}
          </p>
        )}
        <p className="break-words text-2xl font-bold leading-snug">{event.title}</p>
        <p className="mt-0.5 text-xl" style={{ color: "#7e5232" }}>
          {event.event_time ? formatTimeLabel(event.event_time.slice(0, 5)) : "整天"}
          {event.remind_at ? " ・🔔 會提醒" : ""}
        </p>
      </div>
      <button
        onClick={remove}
        disabled={deleting}
        className="shrink-0 rounded-xl px-3 py-2 text-2xl active:opacity-70"
        style={{ color: "#d5544a" }}
        aria-label={`刪除 ${event.title}`}
      >
        🗑
      </button>
    </div>
  );
}

export default function ListView({
  events,
  onDeleted,
}: {
  events: CalendarEvent[];
  onDeleted: () => void;
}) {
  const [showPast, setShowPast] = useState(false);

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const { upcoming, past } = useMemo(() => {
    const upcoming: CalendarEvent[] = [];
    const past: CalendarEvent[] = [];
    for (const event of events) {
      (event.event_date >= todayIso ? upcoming : past).push(event);
    }
    past.reverse(); // 最近的過去排前面
    return { upcoming, past };
  }, [events, todayIso]);

  // 依日期分組
  const groups = useMemo(() => {
    const out: { date: string; items: CalendarEvent[] }[] = [];
    for (const event of upcoming) {
      const last = out[out.length - 1];
      if (last && last.date === event.event_date) last.items.push(event);
      else out.push({ date: event.event_date, items: [event] });
    }
    return out;
  }, [upcoming]);

  if (events.length === 0) {
    return (
      <div className="mt-16 text-center">
        <p className="text-6xl">🌱</p>
        <p className="mt-4 text-2xl" style={{ color: "#9c948a" }}>
          還沒有任何安排
          <br />
          按下面的「➕ 新增」開始吧
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      {groups.length === 0 && (
        <p className="mt-8 text-center text-2xl" style={{ color: "#9c948a" }}>
          接下來沒有安排 🎉
        </p>
      )}

      {groups.map((group) => (
        <section key={group.date}>
          <h2 className="text-xl font-bold" style={{ color: ORANGE }}>
            {relativeDayLabel(group.date) ? `${relativeDayLabel(group.date)}・` : ""}
            {formatDateLabel(group.date)}
          </h2>
          <div className="mt-2 flex flex-col gap-3">
            {group.items.map((event) => (
              <EventRow key={event.id} event={event} onDeleted={onDeleted} />
            ))}
          </div>
        </section>
      ))}

      {past.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowPast((v) => !v)}
            className="text-xl underline"
            style={{ color: "#9c948a" }}
          >
            {showPast ? "收起過去的安排" : `看過去的安排(${past.length} 筆)`}
          </button>
          {showPast && (
            <div className="mt-3 flex flex-col gap-3 opacity-70">
              {past.map((event) => (
                <EventRow key={event.id} event={event} onDeleted={onDeleted} showDate />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
