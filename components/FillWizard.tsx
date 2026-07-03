"use client";

import { useState } from "react";
import type { Anonymity, ModerateResult, Question } from "@/lib/types";

async function moderate(text: string): Promise<ModerateResult> {
  try {
    const res = await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return (await res.json()) as ModerateResult;
  } catch {
    return { verdict: "ok", reasons: [], suggestion: "" };
  }
}

export default function FillWizard({
  sessionId,
  anonymity,
  templateName,
  templateDescription,
  questions,
}: {
  sessionId: string;
  anonymity: Anonymity;
  templateName: string;
  templateDescription: string;
  questions: Question[];
}) {
  const localKey = `retro_filled_${sessionId}`;
  const named = anonymity === "named";

  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [suggestion, setSuggestion] = useState("");
  const [checking, setChecking] = useState(false);

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [already, setAlready] = useState(
    typeof window !== "undefined" && !!localStorage.getItem(`retro_filled_${sessionId}`),
  );

  const hasIdentity = named;
  const totalSteps = (hasIdentity ? 1 : 0) + questions.length + 1; // +review
  const qIndex = hasIdentity ? step - 1 : step;
  const inIdentity = hasIdentity && step === 0;
  const inReview = step === totalSteps - 1;
  const inQuestion = !inIdentity && !inReview;
  const currentQuestion = inQuestion ? questions[qIndex] : null;

  function setValue(key: string, v: string) {
    setValues((s) => ({ ...s, [key]: v }));
    setSuggestion("");
  }

  async function next() {
    setError(null);
    if (inIdentity) {
      if (!name.trim()) {
        setError("請輸入你的名字。");
        return;
      }
      setStep((s) => s + 1);
      return;
    }
    if (inQuestion && currentQuestion) {
      const text = (values[currentQuestion.key] ?? "").trim();
      if (text) {
        setChecking(true);
        const res = await moderate(text);
        setChecking(false);
        if (res.verdict === "revise") {
          setSuggestion(res.suggestion);
          return;
        }
      }
      setSuggestion("");
      setStep((s) => s + 1);
    }
  }

  function back() {
    setError(null);
    setSuggestion("");
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit() {
    setError(null);
    const filled = questions.filter((q) => (values[q.key] ?? "").trim());
    if (filled.length === 0) {
      setError("至少填寫一題再送出。");
      return;
    }
    setSubmitting(true);
    try {
      const results = await Promise.all(
        filled.map(async (q) => ({
          key: q.key,
          result: await moderate(values[q.key].trim()),
        })),
      );
      const bad = results.find((r) => r.result.verdict === "revise");
      if (bad) {
        const idx = questions.findIndex((q) => q.key === bad.key);
        setStep((hasIdentity ? 1 : 0) + idx);
        setSuggestion(bad.result.suggestion);
        setError("有一題需要再調整一下 🙂");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          display_name: named ? name.trim() : undefined,
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

  if (already) {
    return (
      <div className="card">
        <h1 className="text-lg font-semibold">你在這台裝置已經填過了</h1>
        <p className="mt-2 text-sm text-muted">
          每人填一次即可。如果這不是你，換一台裝置或清除瀏覽器資料再試。
        </p>
        <button
          className="btn-ghost mt-3 text-xs"
          onClick={() => setAlready(false)}
        >
          還是要再填一次
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{templateName}</h1>
        <p className="mt-1 text-sm text-muted">{templateDescription}</p>
      </div>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= step ? "bg-accent" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {inIdentity && (
        <div className="card space-y-2">
          <label className="field-label">你的名字</label>
          <input
            autoFocus
            className="textarea"
            placeholder="例：Alex"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void next();
              }
            }}
          />
          <p className="text-xs text-muted">結果與你的名字會一起顯示。</p>
        </div>
      )}

      {inQuestion && currentQuestion && (
        <div className="card">
          <label className="field-label">{currentQuestion.label}</label>
          <textarea
            autoFocus
            rows={4}
            className={`textarea ${
              suggestion ? "border-amber-400 focus:border-amber-400 focus:ring-amber-400" : ""
            }`}
            placeholder={currentQuestion.placeholder}
            value={values[currentQuestion.key] ?? ""}
            onChange={(e) => setValue(currentQuestion.key, e.target.value)}
          />
          <div className="mt-2 min-h-[1.25rem] text-xs">
            {checking && <span className="text-muted">正在確認…</span>}
            {suggestion && (
              <div className="rounded-lg bg-amber-50 p-2 text-amber-800">
                {suggestion}
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            第 {qIndex + 1} / {questions.length} 題（可留空跳過）
          </p>
        </div>
      )}

      {inReview && (
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold">確認送出</h2>
          {named && (
            <p className="text-xs text-muted">
              以「<span className="font-medium">{name.trim() || "（未填）"}</span>」的身分
            </p>
          )}
          <ul className="space-y-3">
            {questions.map((q) => (
              <li key={q.key}>
                <p className="text-xs font-medium">{q.label}</p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted">
                  {(values[q.key] ?? "").trim() || "（未填）"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          className="btn-ghost"
          onClick={back}
          disabled={step === 0 || submitting}
        >
          上一步
        </button>
        {inReview ? (
          <button
            type="button"
            className="btn-primary"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? "送出中…" : "送出回饋"}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={next}
            disabled={checking}
          >
            {checking ? "確認中…" : "下一步"}
          </button>
        )}
      </div>
    </div>
  );
}
