import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getT } from "@/lib/i18n/server";
import type { PublicAnswer, PublicComment } from "@/lib/types";
import ResultsClient from "@/components/ResultsClient";
import ReportView from "@/components/ReportView";
import OwnerControls from "@/components/OwnerControls";
import CloseSessionButton from "@/components/CloseSessionButton";
import BackButton from "@/components/BackButton";

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
    .select(
      "id, owner_id, template_id, anonymity, status, deadline, discussion_enabled, ai_report, ai_report_at",
    )
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

  const answers: PublicAnswer[] = (rawAnswers ?? []).map((a) => ({
    id: a.id,
    question_key: a.question_key,
    content: a.content,
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

  return (
    <div className="container-narrow">
      <BackButton fallback="/" />
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t("res.title", { name: template?.name ?? "Retro" })}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {anonymous ? t("res.modeAnon") : t("res.modeNamed")} ·{" "}
          {t("res.responsesTotal", { n: answers.length })}
          {session.discussion_enabled && ` · ${t("res.discussing")}`}
        </p>
      </div>

      {isOwner && (
        <OwnerControls
          sessionId={session.id}
          discussionEnabled={session.discussion_enabled}
          hasReport={!!session.ai_report}
        />
      )}

      {template ? (
        <>
          <ResultsClient
            sessionId={session.id}
            anonymous={anonymous}
            discussionEnabled={session.discussion_enabled}
            questions={template.questions}
            answers={answers}
            initialComments={initialComments}
            rosterNames={[]}
          />
          <ReportView
            report={session.ai_report}
            generatedAt={session.ai_report_at}
          />
        </>
      ) : (
        <p className="text-sm text-muted">{t("res.noTemplate")}</p>
      )}
    </div>
  );
}
