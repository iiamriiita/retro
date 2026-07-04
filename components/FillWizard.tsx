"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import type { Anonymity, ModerateResult, Question } from "@/lib/types";

async function moderate(
  text: string,
  locale: string,
): Promise<ModerateResult> {
  try {
    const res = await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, locale }),
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
  const { t, locale } = useT();
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
        setError(t("fw.enterName"));
        return;
      }
      setStep((s) => s + 1);
      return;
    }
    if (inQuestion && currentQuestion) {
      // Rating question: require a choice, no moderation.
      if (currentQuestion.type === "rating") {
        if (!(values[currentQuestion.key] ?? "").trim()) {
          setError(t("fw.ratingRequired"));
          return;
        }
        setStep((s) => s + 1);
        return;
      }
      const text = (values[currentQuestion.key] ?? "").trim();
      if (text) {
        setChecking(true);
        const res = await moderate(text, locale);
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


  async function submit() {
    setError(null);
    const filled = questions.filter((q) => (values[q.key] ?? "").trim());
    if (filled.length === 0) {
      setError(t("fw.atLeastOne"));
      return;
    }
    setSubmitting(true);
    try {
      const results = await Promise.all(
        filled
          .filter((q) => q.type !== "rating")
          .map(async (q) => ({
            key: q.key,
            result: await moderate(values[q.key].trim(), locale),
          })),
      );
      const bad = results.find((r) => r.result.verdict === "revise");
      if (bad) {
        const idx = questions.findIndex((q) => q.key === bad.key);
        setStep((hasIdentity ? 1 : 0) + idx);
        setSuggestion(bad.result.suggestion);
        setError(t("fw.oneNeedsFix"));
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
      if (!res.ok) throw new Error(data?.error ?? t("fw.submitFail"));

      if (typeof window !== "undefined") localStorage.setItem(localKey, "1");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("fw.submitFail"));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card">
        <h1 className="text-lg font-semibold">{t("fw.doneTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("fw.doneDesc")}</p>
      </div>
    );
  }

  if (already) {
    return (
      <div className="card">
        <h1 className="text-lg font-semibold">{t("fw.alreadyTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("fw.alreadyDesc")}</p>
        <button
          className="btn-ghost mt-3 text-xs"
          onClick={() => setAlready(false)}
        >
          {t("fw.fillAgain")}
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
          <label className="field-label">{t("fw.yourName")}</label>
          <input
            autoFocus
            className="textarea"
            placeholder={t("fw.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void next();
              }
            }}
          />
          <p className="text-xs text-muted">{t("fw.nameHint")}</p>
        </div>
      )}

      {inQuestion && currentQuestion && currentQuestion.type === "rating" && (
        <div className="card">
          <label className="field-label">{currentQuestion.label}</label>
          <div className="mt-3 flex items-stretch gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const sel = (values[currentQuestion.key] ?? "") === String(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setValue(currentQuestion.key, String(n))}
                  className="flex-1 rounded-lg py-3 text-lg font-bold transition-colors"
                  style={
                    sel
                      ? { background: "var(--accent)", color: "var(--text-inverse)" }
                      : { background: "var(--surface-2)", color: "var(--text-muted)" }
                  }
                >
                  {n}
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-subtle">
            <span>{t("fw.ratingLow")}</span>
            <span>{t("fw.ratingHigh")}</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            {t("fw.qProgressRating", { i: qIndex + 1, n: questions.length })}
          </p>
        </div>
      )}

      {inQuestion && currentQuestion && currentQuestion.type !== "rating" && (
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
            {checking && <span className="text-muted">{t("fw.checking")}</span>}
            {suggestion && (
              <div className="rounded-lg bg-amber-50 p-2 text-amber-800">
                {suggestion}
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            {t("fw.qProgress", { i: qIndex + 1, n: questions.length })}
          </p>
        </div>
      )}

      {inReview && (
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold">{t("fw.reviewTitle")}</h2>
          {named && (
            <p className="text-xs text-muted">
              {t("fw.asIdentity", { name: name.trim() || t("fw.blank") })}
            </p>
          )}
          <ul className="space-y-3">
            {questions.map((q) => (
              <li key={q.key}>
                <p className="text-xs font-medium">{q.label}</p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted">
                  {(values[q.key] ?? "").trim()
                    ? q.type === "rating"
                      ? `${values[q.key]} / 5`
                      : values[q.key]
                    : t("fw.blank")}
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

      <div className="flex justify-end">
        {inReview ? (
          <button
            type="button"
            className="btn-primary"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? t("fw.submitting") : t("fw.submit")}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={next}
            disabled={checking}
          >
            {checking ? t("fw.nextChecking") : t("fw.next")}
          </button>
        )}
      </div>
    </div>
  );
}
