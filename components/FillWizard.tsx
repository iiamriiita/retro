"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import RoleIcon from "@/components/RoleIcon";
import Icon from "@/components/Icon";
import TemplateBanner from "@/components/TemplateBanner";
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
  templateId,
  anonymity,
  templateName,
  templateDescription,
  questions,
}: {
  sessionId: string;
  templateId: string;
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
  const [roleSel, setRoleSel] = useState<Record<string, string>>({});
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
  function selectRole(key: string, role: string) {
    setRoleSel((s) => ({ ...s, [key]: role }));
    setError(null);
  }
  // Whether a question has an answer (role = picked; else non-empty text/rating).
  function isFilled(q: Question) {
    return q.type === "role"
      ? !!roleSel[q.key]
      : !!(values[q.key] ?? "").trim();
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
      // Rating question: require a score; moderate the optional "why".
      if (currentQuestion.type === "rating") {
        if (!(values[currentQuestion.key] ?? "").trim()) {
          setError(t("fw.ratingRequired"));
          return;
        }
        const why = (values[currentQuestion.key + "__why"] ?? "").trim();
        if (why) {
          setChecking(true);
          const res = await moderate(why, locale);
          setChecking(false);
          if (res.verdict === "revise") {
            setSuggestion(res.suggestion);
            return;
          }
        }
        setSuggestion("");
        setStep((s) => s + 1);
        return;
      }
      // Role question: require a pick; moderate the "why" if written.
      if (currentQuestion.type === "role") {
        if (!roleSel[currentQuestion.key]) {
          setError(t("fw.pickRole"));
          return;
        }
        const why = (values[currentQuestion.key] ?? "").trim();
        if (why) {
          setChecking(true);
          const res = await moderate(why, locale);
          setChecking(false);
          if (res.verdict === "revise") {
            setSuggestion(res.suggestion);
            return;
          }
        }
        setSuggestion("");
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

  function back() {
    setError(null);
    setSuggestion("");
    setStep((s) => Math.max(0, s - 1));
  }


  async function submit() {
    setError(null);
    const filled = questions.filter(isFilled);
    if (filled.length === 0) {
      setError(t("fw.atLeastOne"));
      return;
    }
    setSubmitting(true);
    try {
      // Free text to moderate per question: rating → its "why"; else the value
      // (text answer or role reason).
      const freeText = (q: Question) =>
        q.type === "rating"
          ? (values[q.key + "__why"] ?? "").trim()
          : (values[q.key] ?? "").trim();
      const toModerate = questions.filter((q) => freeText(q));
      const results = await Promise.all(
        toModerate.map(async (q) => ({
          key: q.key,
          result: await moderate(freeText(q), locale),
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
          answers: filled.map((q) => {
            if (q.type === "role") {
              const why = (values[q.key] ?? "").trim();
              return {
                question_key: q.key,
                content: why ? `${roleSel[q.key]}｜${why}` : roleSel[q.key],
              };
            }
            if (q.type === "rating") {
              const why = (values[q.key + "__why"] ?? "").trim();
              const score = (values[q.key] ?? "").trim();
              return {
                question_key: q.key,
                content: why ? `${score}｜${why}` : score,
              };
            }
            return { question_key: q.key, content: (values[q.key] ?? "").trim() };
          }),
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
      <div className="card flex flex-col items-center text-center">
        <svg
          width="96"
          height="96"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* confetti */}
          <rect x="78" y="120" width="36" height="36" rx="8" fill="#F0B90B" transform="rotate(-16 96 138)" />
          <rect x="408" y="104" width="36" height="36" rx="8" fill="#8A5A34" transform="rotate(14 426 122)" />
          <line x1="52" y1="214" x2="86" y2="226" stroke="#F0B90B" strokeWidth="14" strokeLinecap="round" />
          <line x1="460" y1="200" x2="426" y2="214" stroke="#F0B90B" strokeWidth="14" strokeLinecap="round" />
          <circle cx="92" cy="292" r="14" fill="#8A5A34" />
          <circle cx="424" cy="286" r="16" fill="#F0B90B" />
          <line x1="118" y1="368" x2="136" y2="398" stroke="#8A5A34" strokeWidth="14" strokeLinecap="round" />
          <line x1="398" y1="356" x2="382" y2="384" stroke="#B98C67" strokeWidth="14" strokeLinecap="round" />
          <rect x="392" y="398" width="34" height="34" rx="8" fill="#F0B90B" transform="rotate(-18 409 415)" />
          {/* ring */}
          <path d="M256 108 A 148 148 0 0 0 256 404" stroke="#F0B90B" strokeWidth="40" fill="none" />
          <path d="M256 108 A 148 148 0 0 1 256 404" stroke="#E0A800" strokeWidth="40" fill="none" />
          {/* inner disc + check */}
          <circle cx="256" cy="256" r="122" fill="#F5EFE3" />
          <path
            d="M206 262 L242 300 L312 222"
            stroke="#7E5232"
            strokeWidth="30"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h1 className="mt-4 text-lg font-semibold">{t("fw.doneTitle")}</h1>
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
      {step === 0 && (
        <div className="overflow-hidden rounded-2xl">
          <TemplateBanner id={templateId} />
        </div>
      )}
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
          <label className="mb-1 block text-[15px] font-medium leading-snug">{t("fw.yourName")}</label>
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
          <label className="mb-1 block text-[15px] font-medium leading-snug">{currentQuestion.label}</label>
          {(() => {
            const q = currentQuestion;
            const scale =
              q.scale ?? [1, 2, 3, 4, 5].map((v) => ({ value: v, emoji: "", label: "" }));
            const chosen = values[q.key] ?? "";
            const chosenLevel = scale.find((s) => String(s.value) === chosen);
            return (
              <>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {scale.map((s) => {
                    const sel = chosen === String(s.value);
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setValue(q.key, String(s.value))}
                        className="flex flex-col items-center gap-1 rounded-lg py-3 transition-colors"
                        style={
                          sel
                            ? { background: "var(--accent)", color: "var(--text-inverse)" }
                            : { background: "var(--surface-2)", color: "var(--text-muted)" }
                        }
                      >
                        {s.emoji && <span className="text-xl leading-none">{s.emoji}</span>}
                        <span className="text-sm font-bold">{s.value}</span>
                      </button>
                    );
                  })}
                </div>
                {chosenLevel ? (
                  <p className="mt-2 text-xs text-muted">
                    {chosenLevel.emoji} {chosenLevel.label}
                  </p>
                ) : (
                  <div className="mt-2 flex justify-between text-xs text-subtle">
                    <span>{t("fw.ratingLow")}</span>
                    <span>{t("fw.ratingHigh")}</span>
                  </div>
                )}
                {chosen && (
                  <>
                    <textarea
                      rows={3}
                      className={`textarea mt-3 ${
                        suggestion ? "border-amber-400 focus:border-amber-400 focus:ring-amber-400" : ""
                      }`}
                      placeholder={t("fw.ratingWhy")}
                      value={values[q.key + "__why"] ?? ""}
                      onChange={(e) => setValue(q.key + "__why", e.target.value)}
                    />
                    <div className="mt-2 min-h-[1.25rem] text-xs">
                      {checking && (
                        <span className="text-muted">{t("fw.checking")}</span>
                      )}
                      {suggestion && (
                        <div className="rounded-lg bg-amber-50 p-2 text-amber-800">
                          {suggestion}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            );
          })()}
          <p className="mt-1 text-xs text-muted">
            {t("fw.qProgressRating", { i: qIndex + 1, n: questions.length })}
          </p>
        </div>
      )}

      {inQuestion && currentQuestion && currentQuestion.type === "role" && (
        <div className="card">
          <label className="mb-1 block text-[15px] font-medium leading-snug">{currentQuestion.label}</label>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(currentQuestion.options ?? []).map((o) => {
              const roleStr = o.label;
              const sel = roleSel[currentQuestion.key] === roleStr;
              return (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => selectRole(currentQuestion.key, roleStr)}
                  className="relative flex flex-col items-center gap-1.5 rounded-lg p-3 text-center transition-colors"
                  style={
                    sel
                      ? { background: "var(--accent-weak)" }
                      : { background: "var(--surface-2)" }
                  }
                >
                  {sel && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--text-inverse)]">
                      <Icon name="check" size={12} />
                    </span>
                  )}
                  <RoleIcon emoji={o.emoji} size={40} />
                  <span className="text-sm font-semibold leading-tight">
                    {o.label}
                  </span>
                  <span className="text-xs leading-snug text-muted">
                    {o.desc}
                  </span>
                </button>
              );
            })}
          </div>
          {roleSel[currentQuestion.key] && (
            <>
              <textarea
                rows={3}
                className={`textarea mt-3 ${
                  suggestion ? "border-amber-400 focus:border-amber-400 focus:ring-amber-400" : ""
                }`}
                placeholder={t("fw.roleWhy")}
                value={values[currentQuestion.key] ?? ""}
                onChange={(e) => setValue(currentQuestion.key, e.target.value)}
              />
              <div className="mt-2 min-h-[1.25rem] text-xs">
                {checking && (
                  <span className="text-muted">{t("fw.checking")}</span>
                )}
                {suggestion && (
                  <div className="rounded-lg bg-amber-50 p-2 text-amber-800">
                    {suggestion}
                  </div>
                )}
              </div>
            </>
          )}
          <p className="mt-1 text-xs text-muted">
            {t("fw.qProgressRating", { i: qIndex + 1, n: questions.length })}
          </p>
        </div>
      )}

      {inQuestion &&
        currentQuestion &&
        currentQuestion.type !== "rating" &&
        currentQuestion.type !== "role" && (
          <div className="card">
            <label className="mb-1 block text-[15px] font-medium leading-snug">{currentQuestion.label}</label>
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
            {questions.map((q) => {
              let shown: string;
              if (q.type === "role") {
                const why = (values[q.key] ?? "").trim();
                shown = roleSel[q.key]
                  ? why
                    ? `${roleSel[q.key]}｜${why}`
                    : roleSel[q.key]
                  : t("fw.blank");
              } else if (q.type === "rating") {
                shown = (values[q.key] ?? "").trim()
                  ? `${values[q.key]} / 5`
                  : t("fw.blank");
              } else {
                shown = (values[q.key] ?? "").trim() || t("fw.blank");
              }
              return (
                <li key={q.key}>
                  <p className="text-xs font-medium">{q.label}</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted">
                    {shown}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {step > 0 && (
          <button
            type="button"
            className="btn-ghost"
            onClick={back}
            disabled={submitting}
          >
            <Icon name="arrow-left" size={15} />
            {t("fw.prev")}
          </button>
        )}
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
            <Icon name="arrow-right" size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
