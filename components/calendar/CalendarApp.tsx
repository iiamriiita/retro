"use client";

import { useCallback, useEffect, useState } from "react";
import type { CalendarEvent } from "@/lib/calendar/types";
import {
  calFetch,
  CalendarApiError,
  enablePush,
  pushSupported,
  storePin,
} from "@/lib/calendar/client";
import AddEvent from "./AddEvent";
import MonthView from "./MonthView";
import ListView from "./ListView";

type Tab = "add" | "month" | "list";

const ORANGE = "#e86a33";
const A2HS_DISMISS_KEY = "calendar_a2hs_dismissed";

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

export default function CalendarApp() {
  const [tab, setTab] = useState<Tab>("add");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // PIN 鎖(有設 CALENDAR_PIN 才會出現)
  const [pinNeeded, setPinNeeded] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // iOS「加入主畫面」引導 + 通知
  const [showA2hs, setShowA2hs] = useState(false);
  const [notifyState, setNotifyState] = useState<
    "unknown" | "off" | "on" | "denied" | "unsupported"
  >("unknown");
  const [enabling, setEnabling] = useState(false);

  const refresh = useCallback(async () => {
    setLoadError(false);
    try {
      const { events } = await calFetch<{ events: CalendarEvent[] }>(
        "/api/calendar/events",
      );
      setEvents(events);
      setPinNeeded(false);
    } catch (err) {
      if (err instanceof CalendarApiError && err.status === 401) {
        setPinNeeded(true);
      } else {
        setLoadError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    // iOS + 還沒加到主畫面 → 顯示教學(可關閉)
    if (
      isIOS() &&
      !isStandalone() &&
      localStorage.getItem(A2HS_DISMISS_KEY) !== "1"
    ) {
      setShowA2hs(true);
    }
    if (!pushSupported()) {
      setNotifyState("unsupported");
    } else if (Notification.permission === "granted") {
      setNotifyState("on");
    } else if (Notification.permission === "denied") {
      setNotifyState("denied");
    } else {
      setNotifyState("off");
    }
  }, []);

  async function handleEnablePush() {
    setEnabling(true);
    const result = await enablePush();
    setEnabling(false);
    if (result === "granted") setNotifyState("on");
    else if (result === "denied") setNotifyState("denied");
    else if (result === "unsupported" || result === "no-key")
      setNotifyState("unsupported");
  }

  function submitPin() {
    if (!pinInput.trim()) return;
    storePin(pinInput.trim());
    setPinError(false);
    setLoading(true);
    refresh().then(() => {
      setPinInput("");
    });
  }

  // ---------- PIN 畫面 ----------
  if (pinNeeded) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-6xl">🔒</div>
        <h1 className="text-3xl font-bold">請輸入通行碼</h1>
        <input
          type="tel"
          inputMode="numeric"
          value={pinInput}
          onChange={(e) => {
            setPinInput(e.target.value);
            setPinError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && submitPin()}
          className="w-full rounded-2xl border-2 bg-white px-5 py-4 text-center text-3xl tracking-widest outline-none"
          style={{ borderColor: pinError ? "#d5544a" : "#eadfd5" }}
          autoFocus
        />
        {pinError && (
          <p className="text-xl" style={{ color: "#d5544a" }}>
            通行碼不對,再試一次
          </p>
        )}
        <button
          onClick={submitPin}
          className="w-full rounded-2xl py-4 text-2xl font-bold text-white active:opacity-80"
          style={{ background: ORANGE }}
        >
          進入行事曆
        </button>
      </main>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      {/* ---------- 標題列 ---------- */}
      <header
        className="sticky top-0 z-10 px-5 pb-3 pt-5"
        style={{
          background: "#fff8f1",
          paddingTop: "max(1.25rem, env(safe-area-inset-top))",
        }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: ORANGE }}>
            📅 媽媽的行事曆
          </h1>
          {notifyState === "off" && (
            <button
              onClick={handleEnablePush}
              disabled={enabling}
              className="rounded-full px-4 py-2 text-lg font-semibold text-white active:opacity-80"
              style={{ background: ORANGE }}
            >
              {enabling ? "設定中…" : "🔔 開啟提醒"}
            </button>
          )}
          {notifyState === "on" && (
            <span className="text-lg" style={{ color: "#47854f" }}>
              🔔 提醒已開啟
            </span>
          )}
        </div>
        {notifyState === "denied" && (
          <p className="mt-2 text-base" style={{ color: "#7e5232" }}>
            通知被關閉了。到 iPhone「設定 → 通知」找到行事曆,重新打開就能收到提醒。
          </p>
        )}
      </header>

      {/* ---------- iOS 加入主畫面教學 ---------- */}
      {showA2hs && (
        <div
          className="mx-5 mb-3 rounded-2xl border-2 bg-white p-4"
          style={{ borderColor: "#f5c9a8" }}
        >
          <p className="text-xl font-bold">先把我加到主畫面 📲</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-lg leading-relaxed">
            <li>
              點下面的<b>分享按鈕</b>(方框加箭頭 ⬆️)
            </li>
            <li>
              往下找到<b>「加入主畫面」</b>
            </li>
            <li>
              按<b>「新增」</b>,之後從桌面打開我
            </li>
          </ol>
          <p className="mt-2 text-base" style={{ color: "#7e5232" }}>
            加到主畫面後,才收得到提醒通知喔!
          </p>
          <button
            onClick={() => {
              localStorage.setItem(A2HS_DISMISS_KEY, "1");
              setShowA2hs(false);
            }}
            className="mt-3 text-lg underline"
            style={{ color: "#7e5232" }}
          >
            知道了,不用再顯示
          </button>
        </div>
      )}

      {/* ---------- 內容 ---------- */}
      <main className="flex-1 px-5 pb-32">
        {loading ? (
          <p className="mt-16 text-center text-2xl" style={{ color: "#9c948a" }}>
            載入中…
          </p>
        ) : loadError ? (
          <div className="mt-16 text-center">
            <p className="text-2xl">連不上網路 😢</p>
            <button
              onClick={() => {
                setLoading(true);
                refresh();
              }}
              className="mt-4 rounded-2xl px-6 py-3 text-xl font-bold text-white"
              style={{ background: ORANGE }}
            >
              再試一次
            </button>
          </div>
        ) : tab === "add" ? (
          <AddEvent
            onSaved={(event) => {
              setEvents((prev) =>
                [...prev, event].sort((a, b) =>
                  (a.event_date + (a.event_time ?? "")) <
                  (b.event_date + (b.event_time ?? ""))
                    ? -1
                    : 1,
                ),
              );
              setTab("list");
            }}
          />
        ) : tab === "month" ? (
          <MonthView events={events} onDeleted={refresh} />
        ) : (
          <ListView events={events} onDeleted={refresh} />
        )}
      </main>

      {/* ---------- 底部大分頁 ---------- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-10 border-t bg-white"
        style={{
          borderColor: "#f0e2d4",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="mx-auto grid max-w-md grid-cols-3">
          {(
            [
              ["add", "➕", "新增"],
              ["month", "📅", "月曆"],
              ["list", "📋", "清單"],
            ] as const
          ).map(([key, icon, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex flex-col items-center gap-0.5 py-3"
              style={{
                color: tab === key ? ORANGE : "#9c948a",
                fontWeight: tab === key ? 700 : 500,
              }}
            >
              <span className="text-2xl leading-none">{icon}</span>
              <span className="text-lg leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
