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

  const answers: PublicAnswer[] = (rawAnswers ?? [])
    .filter((a) => a.question_key !== MOOD_KEY)
    .map((a) => ({
      id: a.id,
      question_key: a.question_key,
      content: roleKeys.has(a.question_key)
        ? stripLeadingEmoji(a.content)
        : a.content,
      author_name: anonymous ? null : (nameById.get(a.participant_id) ?? null),
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

  const shareShowRaw: boolean = session.share_show_raw ?? true;
  const showRaw = isOwner || shareShowRaw;

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
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t("res.title", { name: session.name || template?.name || "Retro" })}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {anonymous ? t("res.modeAnon") : t("res.modeNamed")} ·{" "}
          {t("res.responsesTotal", { n: answers.length })}
          {session.discussion_enabled && ` · ${t("res.discussing")}`}
        </p>
        {avgMood != null && (
          <span
            className="badge mt-3"
            style={{
              background:
                avgMood >= 4
                  ? "var(--green-weak)"
                  : avgMood >= 3
                    ? "var(--accent-weak)"
                    : "var(--danger-weak, rgba(213,84,74,.12))",
              color:
                avgMood >= 4
                  ? "var(--green-500)"
                  : avgMood >= 3
                    ? "var(--gold-700)"
                    : "var(--red-500)",
            }}
          >
            {t("res.avgMood", { avg: avgMood })}
          </span>
        )}
        </div>
        {isOwner && (
          <div id="share-top-anchor" className="hidden w-[300px] shrink-0 md:block">
            <FormLinkButton
              sessionId={session.id}
              ended
              triggerClassName="btn-primary w-full"
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
          {/* Left — AI report on top, raw responses below */}
          <div className="min-w-0 space-y-10">
            <ReportPanel
              sessionId={session.id}
              report={session.ai_report}
              generatedAt={session.ai_report_at}
              isOwner={isOwner}
            />

            {showRaw && (
              <section className="card">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <span style={{ color: "var(--accent)" }}>
                    <Icon name="list" size={19} />
                  </span>
                  {t("res.raw")}
                </h2>
                {moodReasons.length > 0 && (
                  <div
                    className="mb-5 rounded-xl p-4"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <p className="eyebrow">{t("res.moodWhy")}</p>
                    <ul className="mt-2 space-y-1.5">
                      {moodReasons.map((r, i) => (
                        <li key={i} className="text-sm text-muted">
                          <span className="font-semibold text-ink">
                            {scaleEmoji(r.score)} {r.score}/5
                          </span>{" "}
                          — {r.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <ResultsClient
                  sessionId={session.id}
                  anonymous={anonymous}
                  discussionEnabled={session.discussion_enabled}
                  questions={template.questions.filter((q) => q.type !== "rating")}
                  answers={answers}
                  initialComments={initialComments}
                  rosterNames={[]}
                />
              </section>
            )}
          </div>

          {/* Right — owner controls */}
          {isOwner && (
            <OwnerSidebar
              sessionId={session.id}
              discussionEnabled={session.discussion_enabled}
              shareShowRaw={shareShowRaw}
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
