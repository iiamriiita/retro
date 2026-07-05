"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { useT } from "@/lib/i18n/client";
import type { AiInsights, TeamStats } from "@/lib/insights";

function Delta({ value, unit }: { value: number | null; unit: string }) {
  if (value == null) return null;
  const up = value > 0;
  const flat = value === 0;
  const color = flat
    ? "var(--text-subtle)"
    : up
      ? "var(--green-500)"
      : "var(--red-500)";
  return (
    <span
      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold"
      style={{ color }}
    >
      {!flat && (
        <Icon name={up ? "trending-up" : "trending-down"} size={14} />
      )}
      {up ? "+" : ""}
      {value} {unit}
    </span>
  );
}

// Eyebrow label with a small "i" info icon that reveals the explanation on hover.
function CardEyebrow({ label, tip }: { label: string; tip?: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="eyebrow">{label}</span>
      {tip && (
        <span className="group relative inline-flex">
          <span className="cursor-help text-[color:var(--text-subtle)] transition-colors hover:text-[color:var(--text-muted)]">
            <Icon name="info" size={13} />
          </span>
          <span
            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-max max-w-[220px] -translate-x-1/2 rounded-md px-2.5 py-1.5 text-xs font-medium normal-case tracking-normal text-white group-hover:block"
            style={{ background: "#452C1C" }}
          >
            {tip}
          </span>
        </span>
      )}
    </span>
  );
}

function StatCard({
  label,
  value,
  tip,
  children,
}: {
  label: string;
  value: string;
  tip?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col">
      <CardEyebrow label={label} tip={tip} />
      <span className="mt-2 font-display text-3xl font-extrabold tracking-tight">
        {value}
      </span>
      {children}
    </div>
  );
}

type Tr = (key: string, vars?: Record<string, string | number>) => string;

// Colour band for a 1–5 mood score.
function moodColor(score: number): string {
  if (score >= 4) return "var(--green-500)";
  if (score >= 3) return "var(--accent)";
  return "var(--red-500)";
}

// Team sentiment from the 1–5 mood ratings — no AI, always localized.
function deriveSentiment(stats: TeamStats, tr: Tr) {
  const { avgRating, momentum, streak, hasTrend } = stats;

  // No ratings collected yet.
  if (avgRating == null) {
    return {
      label: tr("ti.sentNeutral"),
      color: "var(--text-subtle)",
      note: tr("ti.sentNoData"),
      noteColor: "var(--text-subtle)",
      icon: null as "trending-up" | "trending-down" | null,
    };
  }

  // Label/colour follow the DIRECTION when we have a trend (improving →
  // Positive, declining → Needs attention, steady → Neutral); with a single
  // rating and no trend yet, fall back to the score level.
  let tone: "positive" | "neutral" | "attention";
  if (hasTrend) {
    tone =
      momentum === "up"
        ? "positive"
        : momentum === "down"
          ? "attention"
          : "neutral";
  } else {
    tone = avgRating >= 4 ? "positive" : avgRating >= 3 ? "neutral" : "attention";
  }
  const label =
    tone === "positive"
      ? tr("ti.sentPositive")
      : tone === "neutral"
        ? tr("ti.sentNeutral")
        : tr("ti.sentAttention");
  const color =
    tone === "positive"
      ? "var(--green-500)"
      : tone === "neutral"
        ? "var(--accent)"
        : "var(--red-500)";

  // Note describes the trend of the last rated retros: improving / declining
  // for N in a row, or up / down / steady vs the previous one.
  let note: string;
  let noteColor = "var(--text-subtle)";
  let icon: "trending-up" | "trending-down" | null = null;
  const inARow = streak + 1; // retros in the run
  if (!hasTrend) {
    note = tr("ti.sentScore", { avg: avgRating.toFixed(1) });
  } else if (momentum === "up") {
    note =
      streak >= 2
        ? tr("ti.sentImproving", { n: inARow })
        : tr("ti.sentUp");
    noteColor = "var(--green-500)";
    icon = "trending-up";
  } else if (momentum === "down") {
    note =
      streak >= 2
        ? tr("ti.sentDeclining", { n: inARow })
        : tr("ti.sentDown");
    noteColor = "var(--red-500)";
    icon = "trending-down";
  } else {
    note = tr("ti.sentSteady");
  }

  return { label, color, note, noteColor, icon };
}

export default function TeamInsights({
  stats,
  initialInsights,
  initialGeneratedAt,
}: {
  stats: TeamStats;
  initialInsights: AiInsights | null;
  initialGeneratedAt: string | null;
}) {
  const { t: tr } = useT();
  const [insights, setInsights] = useState<AiInsights | null>(initialInsights);
  const [generatedAt, setGeneratedAt] = useState<string | null>(
    initialGeneratedAt,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/insights", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? tr("ti.genFail"));
      setInsights(data.data as AiInsights);
      setGeneratedAt(data.generated_at as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("ti.genFail"));
    } finally {
      setBusy(false);
    }
  }

  const sentiment = deriveSentiment(stats, tr);
  const maxResp = Math.max(1, ...stats.timeline.map((t) => t.responses));

  // Bar height: participation (submissions / team size) when a team size is
  // set; otherwise responses relative to the busiest retro.
  function barPct(pt: (typeof stats.timeline)[number]): number {
    if (stats.teamSize && stats.teamSize > 0)
      return Math.min(100, Math.round((pt.submitted / stats.teamSize) * 100));
    return Math.round((pt.responses / maxResp) * 100);
  }
  // Per-retro colour by that session's average mood rating; grey when unrated.
  function barColor(pt: (typeof stats.timeline)[number]): string {
    return pt.rating == null ? "var(--surface-3)" : moodColor(pt.rating);
  }
  function barTip(pt: (typeof stats.timeline)[number]): string {
    if (pt.rating != null && stats.teamSize)
      return tr("ti.barTipMood", {
        date: pt.dateLabel,
        n: pt.submitted,
        size: stats.teamSize,
        mood: pt.rating.toFixed(1),
      });
    return stats.teamSize
      ? tr("ti.barTipParticipation", {
          date: pt.dateLabel,
          n: pt.submitted,
          size: stats.teamSize,
        })
      : tr("ti.barTipResponses", { date: pt.dateLabel, n: pt.responses });
  }

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <span
          className="flex h-8 w-8 items-center justify-center"
          style={{ color: "var(--accent)" }}
        >
          <Icon name="line-chart" size={22} />
        </span>
        <h2 className="text-lg font-extrabold tracking-tight">
          {tr("ti.title")}
        </h2>
        <span className="text-sm text-muted">
          {tr("ti.scope", {
            count: stats.retroCount,
            closed: stats.closedCount,
          })}
        </span>
      </div>

      {/* Real stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Team sentiment — computed engagement momentum (no AI) */}
        <div className="card flex flex-col">
          <CardEyebrow
            label={tr("ti.cardSentiment")}
            tip={tr("ti.sentimentTip")}
          />
          <span className="mt-2 inline-flex items-center gap-2 font-display text-3xl font-extrabold tracking-tight">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: sentiment.color }}
            />
            {sentiment.label}
          </span>
          <span
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold"
            style={{ color: sentiment.noteColor }}
          >
            {sentiment.icon && <Icon name={sentiment.icon} size={14} />}
            {sentiment.note}
          </span>
        </div>

        {/* Submission (form) rate */}
        <StatCard
          label={tr("ti.cardSubmission")}
          value={stats.participationAvg != null ? `${stats.participationAvg}%` : "—"}
          tip={
            stats.teamSize
              ? tr("ti.participationHint", { size: stats.teamSize })
              : tr("ti.participationNoTeam")
          }
        >
          <Delta value={stats.participationDelta} unit={tr("ti.vsLast")} />
        </StatCard>

        {/* Discussion activity rate */}
        <StatCard
          label={tr("ti.cardActivity")}
          value={stats.discussionRate != null ? `${stats.discussionRate}%` : "—"}
          tip={tr("ti.activityHint")}
        />
      </div>

      {/* Chart + AI pulse */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Responses over time */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="eyebrow">{tr("ti.chartTitle")}</span>
              <span className="group relative inline-flex">
                <span className="cursor-help text-[color:var(--text-subtle)] transition-colors hover:text-[color:var(--text-muted)]">
                  <Icon name="info" size={13} />
                </span>
                <span
                  className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 hidden w-max max-w-[240px] rounded-md px-2.5 py-1.5 text-xs font-medium normal-case tracking-normal text-white group-hover:block"
                  style={{ background: "#452C1C" }}
                >
                  {tr("ti.chartTip")}
                </span>
              </span>
            </span>
          </div>
          {stats.timeline.length === 0 ? (
            <p className="text-sm text-muted">{tr("ti.noData")}</p>
          ) : (
            <div className="flex h-40 items-stretch gap-2">
              {stats.timeline.map((t, i) => {
                const last = i === stats.timeline.length - 1;
                return (
                  <div
                    key={t.id}
                    className="flex h-full flex-1 flex-col items-center gap-2"
                    title={barTip(t)}
                  >
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-md transition-all"
                        style={{
                          height: `${Math.max(6, barPct(t))}%`,
                          background: barColor(t),
                        }}
                      />
                    </div>
                    <span
                      className={`text-[11px] ${last ? "font-semibold text-ink" : "text-subtle"}`}
                    >
                      {t.dateLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI pulse */}
        <div
          className="card flex flex-col"
          style={{ background: "var(--accent-weak)" }}
        >
          {insights && (
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow">{tr("ti.pulse")}</span>
              <button
                onClick={generate}
                disabled={busy}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--gold-700)] hover:underline disabled:opacity-50"
              >
                <Icon name="sparkles" size={13} />
                {busy ? tr("oc.processing") : tr("ti.regen")}
              </button>
            </div>
          )}

          {!insights ? (
            <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
              <p className="mx-auto max-w-xs text-sm text-muted">
                {tr("ti.emptyDesc")}
              </p>
              <button
                onClick={generate}
                disabled={busy}
                className="btn-primary mx-auto mt-4"
              >
                <Icon name="sparkles" size={15} />
                {busy ? tr("ti.generating") : tr("ti.generate")}
              </button>
              {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
            </div>
          ) : (
            <>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                {insights.pulse}
              </p>

              {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
              {generatedAt && (
                <p className="mt-4 text-[11px] text-subtle">
                  {tr("ti.generatedAt", {
                    date: new Date(generatedAt).toLocaleString(),
                  })}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
