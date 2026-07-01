import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import { getOwnerCookie } from "@/lib/owner";
import type { PublicAnswer } from "@/lib/types";
import ResultsView from "@/components/ResultsView";
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
    .select("id, owner_token, template_id, anonymity, status, deadline")
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
  const cookieToken = await getOwnerCookie(session.id);
  const isOwner = !!cookieToken && cookieToken === session.owner_token;
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
        <ResultsView
          questions={template.questions}
          answers={answers}
          anonymous={anonymous}
        />
      ) : (
        <p className="text-sm text-muted">找不到問卷模板。</p>
      )}

      <p className="mt-10 text-xs text-muted">
        選字留言與 AI 助理總結會在下一階段加入。
      </p>
    </div>
  );
}
