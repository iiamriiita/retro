"use client";

import { useEffect, useRef, useState } from "react";
import {
  parseZhEvent,
  formatDateLabel,
  formatTimeLabel,
  relativeDayLabel,
} from "@/lib/calendar/parse";
import { calFetch } from "@/lib/calendar/client";
import type { CalendarEvent } from "@/lib/calendar/types";

const ORANGE = "#e86a33";

// 瀏覽器語音辨識(iOS Safari 是 webkit 前綴,不一定可用 → 退回鍵盤麥克風)
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
  }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (
    (w.SpeechRecognition as new () => SpeechRecognitionLike) ??
    (w.webkitSpeechRecognition as new () => SpeechRecognitionLike) ??
    null
  );
}

// 提醒選項:有時間的事件用「提前幾分鐘」,整天事件用固定時刻
const TIMED_REMIND_OPTIONS = [
  { key: "60", label: "1 小時前" },
  { key: "180", label: "3 小時前" },
  { key: "1440", label: "前一天" },
  { key: "0", label: "準時" },
  { key: "none", label: "不提醒" },
] as const;

const ALLDAY_REMIND_OPTIONS = [
  { key: "day9", label: "當天早上 9 點" },
  { key: "prev20", label: "前一天晚上 8 點" },
  { key: "none", label: "不提醒" },
] as const;

function computeRemindAt(
  date: string,
  time: string | null,
  choice: string,
): string | null {
  if (choice === "none") return null;
  const [y, m, d] = date.split("-").map(Number);
  if (time) {
    const [hh, mm] = time.split(":").map(Number);
    const at = new Date(y, m - 1, d, hh, mm);
    at.setMinutes(at.getMinutes() - parseInt(choice, 10));
    return at.toISOString();
  }
  if (choice === "prev20") return new Date(y, m - 1, d - 1, 20, 0).toISOString();
  return new Date(y, m - 1, d, 9, 0).toISOString(); // day9
}

export default function AddEvent({
  onSaved,
}: {
  onSaved: (event: CalendarEvent) => void;
}) {
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [remindChoice, setRemindChoice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSpeechAvailable(getSpeechRecognition() !== null);
    return () => recognitionRef.current?.stop();
  }, []);

  const parsed = input.trim() ? parseZhEvent(input) : null;
  const ready = !!(parsed && parsed.date && parsed.title);
  const effectiveRemind =
    remindChoice ?? (parsed?.time ? "60" : "day9");

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = getSpeechRecognition();
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "zh-TW";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setInput(text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setInput("");
    setListening(true);
    recognition.start();
  }

  async function save() {
    if (!parsed?.date || !parsed.title || saving) return;
    setSaving(true);
    setError("");
    try {
      const { event } = await calFetch<{ event: CalendarEvent }>(
        "/api/calendar/events",
        {
          method: "POST",
          body: JSON.stringify({
            title: parsed.title,
            event_date: parsed.date,
            event_time: parsed.time,
            remind_at: computeRemindAt(parsed.date, parsed.time, effectiveRemind),
            raw_input: input,
          }),
        },
      );
      setInput("");
      setRemindChoice(null);
      onSaved(event);
    } catch {
      setError("儲存失敗,請確認網路後再試一次");
    } finally {
      setSaving(false);
    }
  }

  const remindOptions = parsed?.time ? TIMED_REMIND_OPTIONS : ALLDAY_REMIND_OPTIONS;

  return (
    <div className="flex flex-col gap-4 pt-2">
      <p className="text-xl leading-relaxed" style={{ color: "#7e5232" }}>
        用說的或用打的,例如:
        <br />
        <b>「下週三下午三點帶妹妹回診」</b>
      </p>

      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        placeholder={listening ? "我在聽,請說…" : "在這裡輸入…"}
        className="w-full rounded-2xl border-2 bg-white p-4 text-2xl leading-relaxed outline-none"
        style={{ borderColor: listening ? ORANGE : "#eadfd5" }}
      />

      {/* 麥克風:有瀏覽器語音就用一鍵錄音,沒有就教她用鍵盤麥克風 */}
      {speechAvailable ? (
        <button
          onClick={toggleListening}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-5xl text-white shadow-lg active:scale-95"
          style={{ background: listening ? "#d5544a" : ORANGE }}
          aria-label={listening ? "停止錄音" : "開始說話"}
        >
          {listening ? "⏹" : "🎤"}
        </button>
      ) : (
        <button
          onClick={() => textareaRef.current?.focus()}
          className="mx-auto rounded-full border-2 bg-white px-6 py-3 text-xl"
          style={{ borderColor: "#f5c9a8", color: "#7e5232" }}
        >
          點輸入框,再按鍵盤上的 🎤 說話
        </button>
      )}

      {/* 解析結果確認卡 */}
      {parsed && (
        <div
          className="rounded-2xl border-2 bg-white p-5"
          style={{ borderColor: ready ? "#bcd9c0" : "#f5c9a8" }}
        >
          <p className="text-lg font-semibold" style={{ color: "#7e5232" }}>
            我聽到的是:
          </p>

          <div className="mt-3 flex flex-col gap-3 text-2xl">
            <label className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-lg" style={{ color: "#9c948a" }}>
                日期
              </span>
              <input
                type="date"
                value={parsed.date ?? ""}
                onChange={(e) =>
                  setInput(
                    rebuildInput(parsed.title, e.target.value, parsed.time),
                  )
                }
                className="flex-1 rounded-xl border bg-white px-3 py-2 text-xl"
                style={{ borderColor: "#eadfd5" }}
              />
            </label>
            <label className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-lg" style={{ color: "#9c948a" }}>
                時間
              </span>
              <input
                type="time"
                value={parsed.time ?? ""}
                onChange={(e) =>
                  setInput(
                    rebuildInput(parsed.title, parsed.date, e.target.value || null),
                  )
                }
                className="flex-1 rounded-xl border bg-white px-3 py-2 text-xl"
                style={{ borderColor: "#eadfd5" }}
              />
            </label>
            <label className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-lg" style={{ color: "#9c948a" }}>
                事情
              </span>
              <input
                type="text"
                value={parsed.title}
                onChange={(e) =>
                  setInput(rebuildInput(e.target.value, parsed.date, parsed.time))
                }
                placeholder="要做什麼?"
                className="flex-1 rounded-xl border bg-white px-3 py-2 text-xl"
                style={{ borderColor: "#eadfd5" }}
              />
            </label>
          </div>

          {ready && parsed.date && (
            <p className="mt-3 text-xl font-bold" style={{ color: ORANGE }}>
              {relativeDayLabel(parsed.date) ?? ""}
              {formatDateLabel(parsed.date)}
              {parsed.time ? ` ${formatTimeLabel(parsed.time)}` : ""} —{" "}
              {parsed.title}
            </p>
          )}
          {!parsed.date && (
            <p className="mt-3 text-lg" style={{ color: "#7e5232" }}>
              沒聽到日期,幫我選一下上面的日期欄位
            </p>
          )}
          {!parsed.title && (
            <p className="mt-3 text-lg" style={{ color: "#7e5232" }}>
              要做什麼事呢?幫我填一下「事情」
            </p>
          )}

          {/* 提醒 */}
          <div className="mt-4">
            <p className="text-lg font-semibold" style={{ color: "#7e5232" }}>
              什麼時候提醒你?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {remindOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setRemindChoice(option.key)}
                  className="rounded-full border-2 px-4 py-2 text-lg"
                  style={
                    effectiveRemind === option.key
                      ? { background: ORANGE, borderColor: ORANGE, color: "#fff" }
                      : { borderColor: "#eadfd5", color: "#7e5232" }
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={save}
            disabled={!ready || saving}
            className="mt-5 w-full rounded-2xl py-4 text-2xl font-bold text-white active:opacity-80 disabled:opacity-40"
            style={{ background: "#47854f" }}
          >
            {saving ? "儲存中…" : "✓ 加入行事曆"}
          </button>
          {error && (
            <p className="mt-2 text-center text-lg" style={{ color: "#d5544a" }}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// 使用者在確認卡手動改欄位時,把輸入重組成解析器一定看得懂的固定格式。
function rebuildInput(
  title: string,
  date: string | null,
  time: string | null,
): string {
  const parts: string[] = [];
  if (date) {
    const [, m, d] = date.split("-").map(Number);
    parts.push(`${m}月${d}號`);
  }
  if (time) {
    // 早上的時間加「上午」,避免解析器把「3:00」當成下午三點
    const hour = parseInt(time.split(":")[0], 10);
    parts.push(hour < 12 ? `上午${time}` : time);
  }
  parts.push(title);
  return parts.join(" ");
}
