"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Icon from "@/components/Icon";
import { useT } from "@/lib/i18n/client";

// Left-column AI report: rendered report, or an empty state guiding the owner
// to generate one. Generating first asks for the tone in a small dialog.
export default function ReportPanel({
  sessionId,
  report,
  generatedAt,
  isOwner,
}: {
  sessionId: string;
  report: string | null;
  generatedAt: string | null;
  isOwner: boolean;
}) {
  const { t } = useT();
  const router = useRouter();
  const [askTone, setAskTone] = useState(false);
  const TONES = ["neutral", "balanced", "playful"] as const;
  const [toneIdx, setToneIdx] = useState(0);
  const SECTIONS = ["themes", "well", "improve", "actions"] as const;
  const [sections, setSections] = useState<string[]>([...SECTIONS]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSection(k: string) {
    setSections((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );
  }

  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    setAskTone(false); // the card itself shows the progress
    setBusy(true);
    setError(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch(`/api/sessions/${sessionId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone: TONES[toneIdx], sections }),
        signal: ctrl.signal,
      });
      if (!res.ok)
        throw new Error((await res.json())?.error ?? t("oc.genFail"));
      router.refresh();
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError(err instanceof Error ? err.message : t("oc.genFail"));
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  // New reports are stored as JSON (StructuredReport); old ones are markdown.
  type Structured = {
    summary?: string;
    well?: string[];
    improve?: string[];
    actions?: string[];
  };
  let structured: Structured | null = null;
  if (report && report.trim().startsWith("{")) {
    try {
      const o = JSON.parse(report) as Structured;
      if (o && typeof o === "object") structured = o;
    } catch {
      structured = null;
    }
  }

  return (
    <section className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <span style={{ color: "var(--accent)" }}>
            <Icon name="sparkles" size={19} />
          </span>
          {t("rv.title")}
        </h2>
        {isOwner && report && !busy && (
          <button
            type="button"
            className="btn-ghost !h-8 text-xs"
            onClick={() => setAskTone(true)}
          >
            {t("oc.regenReport")}
          </button>
        )}
      </div>

      {busy ? (
        <div className="py-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="animate-pulse" style={{ color: "var(--accent)" }}>
              <Icon name="sparkles" size={18} />
            </span>
            {t("oc.generating")}
          </div>
          <div className="mt-5 space-y-3">
            <div className="rp-skel h-4 w-2/5" />
            <div className="rp-skel h-3 w-full" />
            <div className="rp-skel h-3 w-[92%]" />
            <div className="rp-skel h-3 w-[78%]" />
            <div className="rp-skel mt-6 h-4 w-1/3" />
            <div className="rp-skel h-3 w-full" />
            <div className="rp-skel h-3 w-[85%]" />
          </div>
          <button type="button" className="btn-ghost mt-6" onClick={stop}>
            <Icon name="x" size={14} />
            {t("rp.stop")}
          </button>
        </div>
      ) : structured ? (
        <>
          {structured.summary && (
            <div
              className="border-b pb-5"
              style={{ borderColor: "var(--border)" }}
            >
              <p className="text-[17px] font-semibold leading-relaxed">
                <span
                  className="mr-1 font-display text-2xl leading-none"
                  style={{ color: "var(--accent)", verticalAlign: "-0.28em" }}
                >
                  &ldquo;
                </span>
                {structured.summary}
                <span
                  className="ml-1 font-display text-2xl leading-none"
                  style={{ color: "var(--accent)", verticalAlign: "-0.28em" }}
                >
                  &rdquo;
                </span>
              </p>
            </div>
          )}

          {(structured.well?.length || structured.improve?.length) && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {structured.well?.length ? (
                <div
                  className="rounded-xl p-4"
                  style={{ background: "var(--surface-2)" }}
                >
                  <h3 className="text-[15px] font-semibold">
                    {t("rp.sec_well")}
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {structured.well.map((it, i) => (
                      <li key={i} className="flex gap-2.5 text-sm">
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                          style={{ background: "var(--green-500)" }}
                        />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {structured.improve?.length ? (
                <div
                  className="rounded-xl p-4"
                  style={{ background: "var(--surface-2)" }}
                >
                  <h3 className="text-[15px] font-semibold">
                    {t("rp.sec_improve")}
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {structured.improve.map((it, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--red-500)" }}
                        >
                          <Icon name="alert-triangle" size={14} />
                        </span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          {structured.actions?.length ? (
            <div className="mt-6">
              <h3 className="text-[15px] font-semibold">{t("rp.sec_actions")}</h3>
              <ul className="mt-3 space-y-2">
                {structured.actions.map((it, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span
                      className="shrink-0 font-semibold"
                      style={{ color: "var(--gold-700)" }}
                    >
                      &rarr;
                    </span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {generatedAt && (
            <p className="mt-6 text-xs text-subtle">
              {t("rv.generatedAt", {
                date: new Date(generatedAt).toLocaleString(),
              })}
            </p>
          )}
        </>
      ) : report ? (
        <>
          <div className="prose-sm max-w-none font-body [&_h2]:mt-4 [&_h2]:font-body [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-normal [&_h3]:font-body [&_h3]:tracking-normal [&_li]:ml-4 [&_li]:list-disc [&_li]:text-sm [&_p]:text-sm [&_strong]:font-normal [&_ul]:my-2">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
          {generatedAt && (
            <p className="mt-3 text-xs text-subtle">
              {t("rv.generatedAt", {
                date: new Date(generatedAt).toLocaleString(),
              })}
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center py-8 text-center">
          <span style={{ color: "var(--accent)" }}>
            <Icon name="sparkles" size={28} />
          </span>
          <p className="mt-3 text-sm font-semibold">{t("rp.emptyTitle")}</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            {isOwner ? t("rp.emptyDesc") : t("rp.waitOwner")}
          </p>
          {isOwner && (
            <button
              type="button"
              className="btn-primary mt-5"
              onClick={() => setAskTone(true)}
            >
              <Icon name="sparkles" size={15} />
              {t("oc.genReport")}
            </button>
          )}
        </div>
      )}
      {error && !askTone && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Tone picker dialog */}
      {askTone && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !busy && setAskTone(false)}
          />
          <div className="card relative z-10 w-full max-w-lg">
            <h2 className="text-base font-bold">{t("rp.settingsTitle")}</h2>

            {/* Tone — drag slider */}
            <p className="eyebrow mt-5">{t("rp.toneTitle")}</p>
            <div className="mt-3 px-1">
              <input
                type="range"
                min={0}
                max={2}
                step={1}
                value={toneIdx}
                onChange={(e) => setToneIdx(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: "var(--accent)" }}
              />
              <div className="mt-1 flex justify-between text-xs text-subtle">
                <span>{t("rp.toneNeutral")}</span>
                <span>{t("rp.toneBalanced")}</span>
                <span>{t("rp.tonePlayful")}</span>
              </div>
              <p className="mt-2 text-sm font-medium">
                {t(
                  toneIdx === 0
                    ? "rp.toneNeutral"
                    : toneIdx === 1
                      ? "rp.toneBalanced"
                      : "rp.tonePlayful",
                )}
                <span className="ml-2 font-normal text-muted">
                  {t(
                    toneIdx === 0
                      ? "rp.toneNeutralDesc"
                      : toneIdx === 1
                        ? "rp.toneBalancedDesc"
                        : "rp.tonePlayfulDesc",
                  )}
                </span>
              </p>
            </div>

            {/* Sections */}
            <p className="eyebrow mt-6">{t("rp.sectionsTitle")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {SECTIONS.map((k) => {
                const on = sections.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => toggleSection(k)}
                    className="relative rounded-lg p-3 text-left transition-colors"
                    style={{
                      background: on ? "var(--accent-weak)" : "var(--surface-2)",
                      opacity: on ? undefined : 0.75,
                    }}
                  >
                    {on && (
                      <span
                        className="absolute right-2.5 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--accent)" }}
                      >
                        <Icon name="check" size={18} strokeWidth={3} />
                      </span>
                    )}
                    <span className="block pr-6 text-sm font-medium">
                      {t(`rp.sec_${k}`)}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setAskTone(false)}
                disabled={busy}
              >
                {t("rc.cancel")}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={generate}
                disabled={busy || sections.length === 0}
              >
                <Icon name="sparkles" size={15} />
                {busy ? t("oc.generating") : t("oc.genReport")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
