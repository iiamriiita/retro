import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import { deriveState } from "@/lib/status";
import { computeTeamStats, type RetroRow, type AiInsights } from "@/lib/insights";
import { MOOD_KEY } from "@/lib/templates";
import { getT } from "@/lib/i18n/server";
import FormLinkButton from "@/components/FormLinkButton";
import DeleteRetroButton from "@/components/DeleteRetroButton";
import TeamInsights from "@/components/TeamInsights";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { locale, t } = await getT();

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from("retro_sessions")
    .select(
      "id, name, template_id, anonymity, status, deadline, discussion_enabled, ai_report_at, created_at",
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  // Aggregate per-session answer & comment counts for the Team Insights panel.
  const ids = (sessions ?? []).map((s) => s.id);
  const responsesBySession = new Map<string, number>();
  const commentsBySession = new Map<string, number>();
  const submittedBySession = new Map<string, number>();
  const ratingBySession = new Map<string, number>();
  if (ids.length > 0) {
    const [{ data: ans }, { data: cms }, { data: parts }, { data: moods }] =
      await Promise.all([
        // Text answers only (exclude the mood rating) for the feedback count.
        supabase
          .from("retro_answers")
          .select("session_id")
          .in("session_id", ids)
          .neq("question_key", MOOD_KEY),
        supabase.from("retro_comments").select("session_id").in("session_id", ids),
        supabase
          .from("retro_participants")
          .select("session_id")
          .in("session_id", ids)
          .not("submitted_at", "is", null),
        supabase
          .from("retro_answers")
          .select("session_id, content")
          .in("session_id", ids)
          .eq("question_key", MOOD_KEY),
      ]);
    for (const a of ans ?? [])
      responsesBySession.set(
        a.session_id,
        (responsesBySession.get(a.session_id) ?? 0) + 1,
      );
    for (const c of cms ?? [])
      commentsBySession.set(
        c.session_id,
        (commentsBySession.get(c.session_id) ?? 0) + 1,
      );
    for (const p of parts ?? [])
      submittedBySession.set(
        p.session_id,
        (submittedBySession.get(p.session_id) ?? 0) + 1,
      );
    // Average the 1–5 mood ratings per session.
    const moodSum = new Map<string, number>();
    const moodCount = new Map<string, number>();
    for (const m of moods ?? []) {
      const v = parseInt(m.content, 10);
      if (!Number.isFinite(v)) continue;
      moodSum.set(m.session_id, (moodSum.get(m.session_id) ?? 0) + v);
      moodCount.set(m.session_id, (moodCount.get(m.session_id) ?? 0) + 1);
    }
    for (const [sid, sum] of moodSum)
      ratingBySession.set(sid, sum / (moodCount.get(sid) || 1));
  }

  const { data: team } = await supabase
    .from("retro_teams")
    .select("team_size")
    .eq("owner_id", user.id)
    .maybeSingle();

  const stats = computeTeamStats(
    (sessions ?? []) as RetroRow[],
    responsesBySession,
    commentsBySession,
    submittedBySession,
    team?.team_size ?? null,
    ratingBySession,
  );

  const { data: insightRow } = await supabase
    .from("retro_team_insights")
    .select("data, generated_at")
    .eq("owner_id", user.id)
    .maybeSingle();

  // Only surface cached AI insights when they were generated in the language
  // the dashboard is currently showing; otherwise prompt to regenerate.
  const insightData = insightRow?.data as (AiInsights & { _locale?: string }) | undefined;
  const insightsMatchLocale = insightData?._locale === locale;

  return (
    <div className="container-wide">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {t("dash.title")}
          </h1>
          <p className="mt-1.5 text-sm text-muted">{user.email}</p>
        </div>
        <Link className="btn-primary" href="/dashboard/new">
          <Icon name="plus" size={15} />
          {t("dash.new")}
        </Link>
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="card">
          <p className="text-sm text-muted">{t("dash.empty")}</p>
        </div>
      ) : (
        <>
          <TeamInsights
            stats={stats}
            initialInsights={insightsMatchLocale ? (insightData as AiInsights) : null}
            initialGeneratedAt={insightsMatchLocale ? insightRow?.generated_at ?? null : null}
          />
          <div className="mb-4 flex items-center gap-3">
            <span
              className="flex h-8 w-8 items-center justify-center"
              style={{ color: "var(--accent)" }}
            >
              <Icon name="list" size={22} />
            </span>
            <h2 className="text-lg font-extrabold tracking-tight">
              {t("dash.allRetros")}
            </h2>
          </div>
          <ul className="space-y-3">
          {sessions.map((s) => {
            const state = deriveState({
              status: s.status,
              deadline: s.deadline,
              discussion_enabled: s.discussion_enabled,
              ai_report_at: s.ai_report_at,
            });
            const template = getTemplate(s.template_id, locale);
            return (
              <li key={s.id} className="card flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[15px] font-bold">
                      {s.name || template?.name || s.template_id}
                    </span>
                    <span
                      className={
                        state.primary.tone === "open"
                          ? "badge badge-success"
                          : "badge"
                      }
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{
                          background:
                            state.primary.tone === "open"
                              ? "var(--green-500)"
                              : "var(--text-subtle)",
                        }}
                      />
                      {t(state.primary.key)}
                    </span>
                    {state.badgeKeys.map((b) => (
                      <span key={b} className="badge badge-accent">
                        <Icon
                          name={b === "status.discussing" ? "message" : "sparkles"}
                          size={12}
                        />
                        {t(b)}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {t("dash.responses", { n: submittedBySession.get(s.id) ?? 0 })} ·{" "}
                    {s.anonymity === "anonymous"
                      ? t("dash.anonymous")
                      : t("dash.named")}{" "}
                    · {t("dash.due", { date: new Date(s.deadline).toLocaleString() })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <FormLinkButton
                    sessionId={s.id}
                    ended={state.primary.tone === "closed"}
                  />
                  <Link
                    className="btn-primary !py-1.5 text-xs"
                    href={`/s/${s.id}/results`}
                  >
                    {t("dash.manage")}
                  </Link>
                  <DeleteRetroButton sessionId={s.id} />
                </div>
              </li>
            );
          })}
          </ul>
        </>
      )}
    </div>
  );
}
