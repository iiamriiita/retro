import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import type { PublicAnswer, PublicComment } from "@/lib/types";
import ResultsClient from "@/components/ResultsClient";
import AiSummary from "@/components/AiSummary";
import CloseSessionButton from "@/components/CloseSessionButton";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ session_id: string }>;
}) {
  const { session_id } = await params;
  const supabase = createServiceClient();

  const { data: session } = await supabase
    .from("retro_sessions")
    .select("id, owner_id, template_id, anonymity, status, deadline")
    .eq("id", session_id)
    .single();

  if (!session) {
    return (
      <div className="container-narrow">
        <div className="card">
          <h1 className="text-lg font-semibold">找不到這場 Retro</h1>
        </div>
      </div>
    );
  }

  const template = getTemplate(session.template_id);
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
      .eq("session_id", session.id);

    return (
      <div className="container-narrow space-y-5">
        <div className="card">
          <h1 className="text-lg font-semibold">Session 進行中</h1>
          <p className="mt-2 text-sm text-muted">
            目前已有 {count ?? 0} 人填寫。結束後才會顯示結果。
          </p>
        </div>
        {isOwner ? (
          <div className="card">
            <p className="mb-3 text-sm text-muted">
              你是這場的發起者，準備好了就可以結束 session。
            </p>
            <CloseSessionButton sessionId={session.id} />
          </div>
        ) : (
          <p className="text-sm text-muted">
            等發起者結束 session（或到截止時間）後，回到這頁就能看到結果。
          </p>
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
    nameById = new Map(
      (participants ?? []).map((p) => [p.id, p.display_name]),
    );
  }

  // NOTE: in anonymous mode we never attach any author-identifying field.
  const answers: PublicAnswer[] = (rawAnswers ?? []).map((a) => ({
    id: a.id,
    question_key: a.question_key,
    content: a.content,
    author_name: anonymous ? null : (nameById.get(a.participant_id) ?? null),
  }));

  // Existing comment threads (de-identified in anonymous mode).
  const { data: rawComments } = await supabase
    .from("retro_comments")
    .select("id, answer_id, quote, quote_start, quote_end, body, author_name, created_at")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  const initialComments: PublicComment[] = (rawComments ?? []).map((c) => ({
    id: c.id,
    answer_id: c.answer_id,
    quote: c.quote,
    quote_start: c.quote_start,
    quote_end: c.quote_end,
    body: c.body,
    author_name: anonymous ? null : c.author_name,
    created_at: c.created_at,
  }));

  return (
    <div className="container-wide">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {template?.name ?? "Retro"} — 結果
          </h1>
          <p className="mt-1 text-sm text-muted">
            {anonymous ? "匿名模式" : "具名模式"} · 共 {answers.length} 則回答
          </p>
        </div>
      </div>

      {template ? (
        <>
          <ResultsClient
            sessionId={session.id}
            anonymous={anonymous}
            questions={template.questions}
            answers={answers}
            initialComments={initialComments}
          />
          <AiSummary sessionId={session.id} />
        </>
      ) : (
        <p className="text-sm text-muted">找不到問卷模板。</p>
      )}
    </div>
  );
}
