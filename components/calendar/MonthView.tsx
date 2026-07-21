"use client";

import { useMemo, useState } from "react";
import type { CalendarEvent } from "@/lib/calendar/types";
import { EventRow } from "./ListView";

const ORANGE = "#e86a33";
const WEEK_HEADER = ["日", "一", "二", "三", "四", "五", "六"];

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function MonthView({
  events,
  onDeleted,
}: {
  events: CalendarEvent[];
  onDeleted: () => void;
}) {
  const now = new Date();
  const todayIso = iso(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [selected, setSelected] = useState<string>(todayIso);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.event_date) ?? [];
      list.push(event);
      map.set(event.event_date, list);
    }
    return map;
  }, [events]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  // 該月格子(含前後補空)
  const cells: (number | null)[] = [];
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedEvents = byDate.get(selected) ?? [];
  const [sy, sm, sd] = selected.split("-").map(Number);

  return (
    <div className="pt-2">
      {/* 月份切換 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => shiftMonth(-1)}
          className="h-14 w-14 rounded-2xl bg-white text-3xl active:opacity-70"
          style={{ border: "2px solid #eadfd5", color: ORANGE }}
          aria-label="上個月"
        >
          ‹
        </button>
        <p className="text-2xl font-bold">
          {year} 年 {month + 1} 月
        </p>
        <button
          onClick={() => shiftMonth(1)}
          className="h-14 w-14 rounded-2xl bg-white text-3xl active:opacity-70"
          style={{ border: "2px solid #eadfd5", color: ORANGE }}
          aria-label="下個月"
        >
          ›
        </button>
      </div>

      {/* 週標頭 */}
      <div className="mt-4 grid grid-cols-7 text-center text-lg" style={{ color: "#9c948a" }}>
        {WEEK_HEADER.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      {/* 日格 */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateIso = iso(year, month, day);
          const count = byDate.get(dateIso)?.length ?? 0;
          const isToday = dateIso === todayIso;
          const isSelected = dateIso === selected;
          return (
            <button
              key={dateIso}
              onClick={() => setSelected(dateIso)}
              className="flex aspect-square flex-col items-center justify-center rounded-xl"
              style={{
                background: isSelected ? ORANGE : isToday ? "#fde8d7" : "transparent",
                color: isSelected ? "#fff" : "#3a2a20",
                border: isToday && !isSelected ? `2px solid ${ORANGE}` : "none",
              }}
            >
              <span className="text-xl font-semibold leading-none">{day}</span>
              <span
                className="mt-1 flex h-2 items-center gap-0.5"
                aria-hidden
              >
                {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                  <span
                    key={j}
                    className="h-2 w-2 rounded-full"
                    style={{ background: isSelected ? "#fff" : ORANGE }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* 選中日期的事件 */}
      <div className="mt-5">
        <p className="text-xl font-bold">
          {sm}月{sd}日(週{WEEK_HEADER[new Date(sy, sm - 1, sd).getDay()]})
        </p>
        {selectedEvents.length === 0 ? (
          <p className="mt-3 text-xl" style={{ color: "#9c948a" }}>
            這天沒有安排 🎉
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {selectedEvents.map((event) => (
              <EventRow key={event.id} event={event} onDeleted={onDeleted} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
