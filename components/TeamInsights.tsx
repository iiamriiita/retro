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

function StatCard({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col">
      <span className="eyebrow">{label}</span>
      <span className="mt-2 font-display text-3xl font-extrabold tracking-tight">
        {value}
      </span>
      {children}
    </div>
  );
}

function themeTone(direction: "up" | "warning" | "down") {
  if (direction === "up")
    return { color: "var(--green-500)", icon: "trending-up" as const };
  if (direction === "down")
    return { color: "var(--red-500)", icon: "trending-down" as const };
  return { color: "var(--red-500)", icon: "alert-triangle" as const };
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

  const maxBar = Math.max(1, ...stats.timeline.map((t) => t.responses));

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
        <span className="eyebrow">
          {tr("ti.scope", {
            count: stats.retroCount,
            closed: stats.closedCount,
          })}
        </span>
      </div>

      {/* Real stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={tr("ti.cardFeedback")} value={String(stats.totalResponses)}>
          <span className="mt-1 text-xs text-subtle">
            {tr("ti.avgPerRetro", { n: stats.avgResponses })}
          </span>
          <Delta value={stats.responsesDelta} unit={tr("ti.vsLast")} />
        </StatCard>
        <StatCard label={tr("ti.cardComments")} value={String(stats.totalComments)}>
          <span className="mt-1 text-xs text-subtle">{tr("ti.acrossAll")}</span>
          <Delta value={stats.commentsDelta} unit={tr("ti.vsLast")} />
        </StatCard>
        <StatCard
          label={tr("ti.cardCompleted")}
          value={`${stats.closedCount} / ${stats.retroCount}`}
        >
          <span className="mt-1 text-xs text-subtle">{tr("ti.endedAll")}</span>
        </StatCard>
      </div>

      {/* Chart + AI pulse */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Responses over time */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold">{tr("ti.chartTitle")}</h3>
            <span className="eyebrow">
              {tr("ti.lastN", { n: stats.timeline.length })}
            </span>
          </div>
          {stats.timeline.length === 0 ? (
            <p className="text-sm text-muted">{tr("ti.noData")}</p>
          ) : (
            <div className="flex h-40 items-end gap-2">
              {stats.timeline.map((t, i) => {
                const last = i === stats.timeline.length - 1;
                return (
                  <div
                    key={t.id}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-md"
                        style={{
                          height: `${Math.max(6, (t.responses / maxBar) * 100)}%`,
                          background: last
                            ? "var(--accent)"
                            : "var(--brown-200, #E4D0BA)",
                        }}
                        title={tr("rc.responses", { n: t.responses })}
                      />
                    </div>
                    <span
                      className={`text-[11px] ${last ? "font-semibold text-[color:var(--gold-700)]" : "text-subtle"}`}
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
          className="card"
          style={{ background: "var(--accent-weak)" }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: "var(--accent)",
                color: "var(--text-inverse)",
              }}
            >
              <Icon name="sparkles" size={16} />
            </span>
            <h3 className="text-sm font-bold">{tr("ti.pulse")}</h3>
            {insights && (
              <button
                onClick={generate}
                disabled={busy}
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--gold-700)] hover:underline disabled:opacity-50"
              >
                <Icon name="sparkles" size={13} />
                {busy ? tr("oc.processing") : tr("ti.regen")}
              </button>
            )}
          </div>

          {!insights ? (
            <div className="py-4 text-center">
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
              <div className="mb-2 flex items-baseline gap-2">
                <span className="inline-flex items-center gap-2 text-lg font-extrabold">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: "var(--green-500)" }}
                  />
                  {insights.sentiment.label}
                </span>
                <span className="text-xs text-muted">
                  {insights.sentiment.note}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-ink">
                {insights.pulse}
              </p>

              {insights.themes.length > 0 && (
                <>
                  <p className="eyebrow mt-4">{tr("ti.themes")}</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                    {insights.themes.map((t, i) => {
                      const tone = themeTone(t.direction);
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold"
                          style={{ color: tone.color }}
                        >
                          <Icon name={tone.icon} size={14} />
                          {t.label} ×{t.count}
                        </span>
                      );
                    })}
                  </div>
                </>
              )}

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
