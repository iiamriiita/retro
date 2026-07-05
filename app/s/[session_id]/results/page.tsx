import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate, MOOD_KEY } from "@/lib/templates";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getT } from "@/lib/i18n/server";
import type { PublicAnswer, PublicComment } from "@/lib/types";
import ResultsClient from "@/components/ResultsClient";
import ReportPanel from "@/components/ReportPanel";
import OwnerSidebar from "@/components/OwnerSidebar";
import Icon from "@/components/Icon";
import CloseSessionButton from "@/components/CloseSessionButton";
import FormLinkButton from "@/components/FormLinkButton";
import BackButton from "@/components/BackButton";
import TemplateBanner from "@/components/TemplateBanner";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ session_id: string }>;
}) {
  const { session_id } = await params;
  const supabase = createServiceClient();
  const { locale, t } = await getT();

  const { data: session } = await supabase
    .from("retro_sessions")
    .select("*")
    .eq("id", session_id)
    .single();

  if (!session) {
    return (
      <div className="container-narrow">
        <div className="card">
          <h1 className="text-lg font-semibold">{t("fill.notFound")}</h1>
        </div>
      </div>
    );
  }

  const template = getTemplate(session.template_id, locale);
  const user = await getCurrentUser();
  const isOwner = !!user && user.id === session.owner_id;
  const expired = new Date(session.deadline).getTime() <= Date.now();
  const viewable = session.status === "closed" || expired;
  const anonymous = session.anonymity === "anonymous";

  // Still open and not expired → results are not shown yet.
  if (!viewable) {
    const { count } = await supabase
      .from("retro_participants")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id)
      .not("submitted_at", "is", null);

    return (
      <div className="container-narrow space-y-5">
        <BackButton fallback="/dashboard" />
        <div className="card">
          <h1 className="text-lg font-semibold">{t("res.inProgressTitle")}</h1>
          <p className="mt-2 text-sm text-muted">
            {t("res.inProgressDesc", { n: count ?? 0 })}
          </p>
        </div>
        {isOwner ? (
          <div className="card">
            <p className="mb-3 text-sm text-muted">{t("res.ownerCanEnd")}</p>
            <CloseSessionButton sessionId={session.id} />
          </div>
        ) : (
          <p className="text-sm text-muted">{t("res.waitOrganizer")}</p>
        )}
      </div>
    );
  }

  // Viewable → load answers, de-identify for anonymous sessions.
  const { data: rawAnswers } = await supabase
    .from("retro_answers")
    .select("id, question_key, content, participant_id, created_at")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  let nameById = new Map<string, string | null>();
  if (!anonymous) {
    const { data: participants } = await supabase
      .from("retro_participants")
      .select("id, display_name")
      .eq("session_id", session.id);
    nameById = new Map((participants ?? []).map((p) => [p.id, p.display_name]));
  }

  // Split the mood rating out of the displayed answers and average it.
  const moodRows = (rawAnswers ?? []).filter((a) => a.question_key === MOOD_KEY);
  const moodValues = moodRows
    .map((a) => parseInt(a.content, 10))
    .filter((v) => Number.isFinite(v));
  const avgMood =
    moodValues.length > 0
      ? Math.round((moodValues.reduce((n, v) => n + v, 0) / moodValues.length) * 10) /
        10
      : null;

  // Optional per-person "why I gave this score" reasons.
  const ratingQ = template?.questions.find((q) => q.type === "rating");
  const scaleEmoji = (v: number) =>
    ratingQ?.scale?.find((s) => s.value === v)?.emoji ?? "";
  const moodReasons = moodRows
    .map((a) => {
      const [scoreStr, ...rest] = a.content.split("｜");
      const reason = rest.join("｜").trim();
      const score = parseInt(scoreStr, 10);
      return reason && Number.isFinite(score) ? { score, reason } : null;
    })
    .filter((x): x is { score: number; reason: string } => x !== null);

  // Role answers were historically stored as "<emoji> <label>"; drop a leading
  // emoji so results read as plain text (matches the rest of the UI).
  const roleKeys = new Set(
    (template?.questions ?? [])
      .filter((q) => q.type === "role")
      .map((q) => q.key),
  );
  const stripLeadingEmoji = (s: string) =>
    s.replace(
      /^\p{Extended_Pictographic}(‍\p{Extended_Pictographic})*️?\s*/u,
      "",
    );

  // Stable per-respondent index in order of first appearance.
  const authorIdx = new Map<string, number>();
  for (const a of rawAnswers ?? []) {
    if (!authorIdx.has(a.participant_id))
      authorIdx.set(a.participant_id, authorIdx.size + 1);
  }
  const respondentCount = authorIdx.size;

  const answers: PublicAnswer[] = (rawAnswers ?? [])
    .filter((a) => a.question_key !== MOOD_KEY)
    .map((a) => ({
      id: a.id,
      question_key: a.question_key,
      content: roleKeys.has(a.question_key)
        ? stripLeadingEmoji(a.content)
        : a.content,
      author_name: anonymous ? null : (nameById.get(a.participant_id) ?? null),
      author_key: String(authorIdx.get(a.participant_id) ?? 0),
    }));

  // Comment threads. Author names come from the commenter's discussion identity,
  // so they are shown as stored (not tied to answer anonymity).
  const { data: rawComments } = await supabase
    .from("retro_comments")
    .select(
      "id, answer_id, parent_id, quote, quote_start, quote_end, body, author_name, created_at",
    )
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  const initialComments: PublicComment[] = (rawComments ?? []).map((c) => ({
    id: c.id,
    answer_id: c.answer_id,
    parent_id: c.parent_id,
    quote: c.quote,
    quote_start: c.quote_start,
    quote_end: c.quote_end,
    body: c.body,
    author_name: c.author_name,
    created_at: c.created_at,
  }));

  // Mood summary: colour band + the scale's scenario label for the rounded score.
  const moodColor =
    avgMood == null
      ? "var(--text)"
      : avgMood >= 4
        ? "var(--green-500)"
        : avgMood >= 3
          ? "var(--gold-700)"
          : "var(--red-500)";
  const moodLevel =
    avgMood == null
      ? null
      : (ratingQ?.scale?.find((sc) => sc.value === Math.round(avgMood)) ?? null);

  const shareView: "both" | "report" | "raw" =
    session.share_view ??
    (session.share_show_raw === false ? "report" : "both");
  const showRaw = isOwner || shareView !== "report";
  const showReport = isOwner || shareView !== "raw";

  return (
    <>
      <div
        className="relative left-1/2 -mt-10 mb-8 w-screen -translate-x-1/2"
        style={{ height: "clamp(150px, 22vw, 300px)" }}
      >
        <TemplateBanner id={session.template_id} />
      </div>
      <div className="container-wide">
      <BackButton fallback="/" />
      <div className="mb-6 flex items-start justify-between gap-6">
        <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {t("res.title", { name: session.name || template?.name || "Retro" })}
          </h1>
          {session.discussion_enabled && (
            <span className="group relative inline-flex">
              <span className="badge badge-accent !px-1.5">
                <Icon name="message" size={13} />
              </span>
              <span
                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-max -translate-x-1/2 rounded-md px-2.5 py-1.5 text-xs font-medium text-white group-hover:block"
                style={{ background: "var(--text)" }}
              >
                {t("status.discussing")}
              </span>
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-muted">
          {anonymous ? t("res.modeAnon") : t("res.modeNamed")} ·{" "}
          {t("res.responsesTotal", { n: respondentCount })}
        </p>
        </div>
        {isOwner && (
          <div id="share-top-anchor" className="hidden shrink-0 md:block">
            <FormLinkButton
              sessionId={session.id}
              ended
              discussionEnabled={session.discussion_enabled}
              triggerClassName="btn-primary"
            />
          </div>
        )}
      </div>

      {template ? (
        <div
          className={
            isOwner
              ? "grid gap-6 md:grid-cols-[minmax(0,1fr)_300px]"
              : "grid gap-6"
          }
        >
          {/* Left — mood, AI report, raw responses */}
          <div className="min-w-0 space-y-6">
            {avgMood != null && (
              <section className="card">
                <p className="text-[15px] font-medium">{t("res.moodTitle")}</p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span
                    className="text-3xl font-extrabold tracking-tight"
                    style={{ color: moodColor }}
                  >
                    {avgMood}
                  </span>
                  <span className="text-sm text-subtle">/ 5</span>
                </div>
                {moodLevel && (
                  <p className="mt-2 text-sm text-muted">
                    {moodLevel.emoji} {moodLevel.label}
                  </p>
                )}
              </section>
            )}

            {showReport && (
              <ReportPanel
                sessionId={session.id}
                report={session.ai_report}
                generatedAt={session.ai_report_at}
                isOwner={isOwner}
              />
            )}

            {showRaw && (
              <section>
                <ResultsClient
                  sessionId={session.id}
                  anonymous={anonymous}
                  discussionEnabled={session.discussion_enabled}
                  questions={template.questions.filter((q) => q.type !== "rating")}
                  answers={answers}
                  initialComments={initialComments}
                  rosterNames={[]}
                  moodReasons={moodReasons.map((r) => ({
                    ...r,
                    emoji: scaleEmoji(r.score),
                  }))}
                />
              </section>
            )}
          </div>

          {/* Right — owner controls */}
          {isOwner && (
            <OwnerSidebar
              sessionId={session.id}
              discussionEnabled={session.discussion_enabled}
              shareView={shareView}
              hasReport={!!session.ai_report}
            />
          )}
        </div>
      ) : (
        <p className="text-sm text-muted">{t("res.noTemplate")}</p>
      )}
      </div>
    </>
  );
}
