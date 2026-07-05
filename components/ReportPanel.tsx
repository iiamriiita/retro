"use client";

import { useState } from "react";
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

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone: TONES[toneIdx], sections }),
      });
      if (!res.ok)
        throw new Error((await res.json())?.error ?? t("oc.genFail"));
      setAskTone(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("oc.genFail"));
    } finally {
      setBusy(false);
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
        {isOwner && report && (
          <button
            type="button"
            className="btn-ghost !h-8 text-xs"
            onClick={() => setAskTone(true)}
          >
            {t("oc.regenReport")}
          </button>
        )}
      </div>

      {report ? (
        <>
          <div className="prose-sm max-w-none [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:text-sm [&_ul]:my-2">
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
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--text-inverse)]">
                        <Icon name="check" size={12} />
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
