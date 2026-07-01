"use client";

import { useEffect, useMemo, useState } from "react";
import type { Anonymity, ModerateResult, Question } from "@/lib/types";
import QuestionField, { type FieldStatus } from "./QuestionField";

function useCountdown(deadlineIso: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = new Date(deadlineIso).getTime() - now;
  if (ms <= 0) return { expired: true, label: "已截止" };
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const label =
    d > 0 ? `${d} 天 ${h} 小時` : h > 0 ? `${h} 小時 ${m} 分` : `${m} 分 ${sec} 秒`;
  return { expired: false, label };
}

async function moderate(text: string): Promise<ModerateResult> {
  try {
    const res = await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return (await res.json()) as ModerateResult;
  } catch {
    // Never block on our outage.
    return { verdict: "ok", reasons: [], suggestion: "" };
  }
}

export default function FillForm({
  sessionId,
  anonymity,
  deadline,
  templateName,
  templateDescription,
  questions,
}: {
  sessionId: string;
  anonymity: Anonymity;
  deadline: string;
  templateName: string;
  templateDescription: string;
  questions: Question[];
}) {
  const localKey = `retro_filled_${sessionId}`;
  const { expired, label } = useCountdown(deadline);

  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, FieldStatus>>({});
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [alreadyFilled, setAlreadyFilled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(localKey)) {
      setAlreadyFilled(true);
    }
  }, [localKey]);

  const hasContent = useMemo(
    () => questions.some((q) => (values[q.key] ?? "").trim().length > 0),
    [values, questions],
  );

  function setValue(key: string, v: string) {
    setValues((s) => ({ ...s, [key]: v }));
    setStatuses((s) => ({ ...s, [key]: "idle" }));
  }

  // Moderate a single field on blur for immediate feedback.
  async function checkField(key: string): Promise<boolean> {
    const text = (values[key] ?? "").trim();
    if (!text) {
      setStatuses((s) => ({ ...s, [key]: "idle" }));
      return true;
    }
    setStatuses((s) => ({ ...s, [key]: "checking" }));
    const result = await moderate(text);
    if (result.verdict === "revise") {
      setStatuses((s) => ({ ...s, [key]: "revise" }));
      setSuggestions((s) => ({ ...s, [key]: result.suggestion }));
      return false;
    }
    setStatuses((s) => ({ ...s, [key]: "ok" }));
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (anonymity === "named" && !name.trim()) {
      setError("請先填寫暱稱。");
      return;
    }
    if (!hasContent) {
      setError("至少填寫一題再送出。");
      return;
    }

    setSubmitting(true);
    try {
      // Re-check every non-empty answer; block submit if any needs a rewrite.
      const filled = questions.filter((q) => (values[q.key] ?? "").trim());
      const results = await Promise.all(
        filled.map(async (q) => ({
          key: q.key,
          result: await moderate(values[q.key].trim()),
        })),
      );

      let blocked = false;
      const nextStatuses: Record<string, FieldStatus> = {};
      const nextSuggestions: Record<string, string> = {};
      for (const { key, result } of results) {
        if (result.verdict === "revise") {
          blocked = true;
          nextStatuses[key] = "revise";
          nextSuggestions[key] = result.suggestion;
        } else {
          nextStatuses[key] = "ok";
        }
      }
      setStatuses((s) => ({ ...s, ...nextStatuses }));
      setSuggestions((s) => ({ ...s, ...nextSuggestions }));

      if (blocked) {
        setError("有幾題需要再調整一下，看看下方的提示 🙂");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          display_name: anonymity === "named" ? name.trim() : undefined,
          answers: filled.map((q) => ({
            question_key: q.key,
            content: values[q.key].trim(),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "送出失敗");

      if (typeof window !== "undefined") localStorage.setItem(localKey, "1");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送出失敗");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card">
        <h1 className="text-lg font-semibold">已送出，謝謝你的回饋 🙌</h1>
        <p className="mt-2 text-sm text-muted">
          等發起者結束 session 後，就能一起看結果。
        </p>
      </div>
    );
  }

  if (alreadyFilled) {
    return (
      <div className="card">
        <h1 className="text-lg font-semibold">你在這台裝置已經填過了</h1>
        <p className="mt-2 text-sm text-muted">
          每人填一次即可。如果這不是你，換一台裝置或清除瀏覽器資料再試。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">{templateName}</h1>
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              expired
                ? "bg-red-50 text-red-600"
                : "bg-gray-100 text-muted"
            }`}
          >
            {expired ? "已截止" : `剩餘 ${label}`}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">{templateDescription}</p>
      </div>

      {anonymity === "named" && (
        <div className="card">
          <label className="field-label" htmlFor="nickname">
            你的暱稱
          </label>
          <input
            id="nickname"
            className="textarea"
            placeholder="例：Alex"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      )}
      {anonymity === "anonymous" && (
        <p className="rounded-lg bg-gray-50 p-3 text-xs text-muted">
          這場是匿名的，你的身分不會顯示在結果裡。
        </p>
      )}

      {questions.map((q) => (
        <QuestionField
          key={q.key}
          question={q}
          value={values[q.key] ?? ""}
          status={statuses[q.key] ?? "idle"}
          suggestion={suggestions[q.key] ?? ""}
          onChange={(v) => setValue(q.key, v)}
          onBlur={() => void checkField(q.key)}
        />
      ))}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn-primary"
        disabled={submitting || expired}
      >
        {submitting ? "送出中…" : "送出回饋"}
      </button>
    </form>
  );
}
