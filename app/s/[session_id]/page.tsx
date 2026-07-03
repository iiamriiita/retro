import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import FillWizard, { type RosterMember } from "@/components/FillWizard";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";

export default async function FillPage({
  params,
}: {
  params: Promise<{ session_id: string }>;
}) {
  const { session_id } = await params;
  const supabase = createServiceClient();

  const { data: session } = await supabase
    .from("retro_sessions")
    .select("id, template_id, anonymity, status, deadline, allow_adhoc")
    .eq("id", session_id)
    .single();

  if (!session) {
    return (
      <div className="container-narrow">
        <div className="card">
          <h1 className="text-lg font-semibold">找不到這場 Retro</h1>
          <p className="mt-2 text-sm text-muted">連結可能有誤或已被刪除。</p>
        </div>
      </div>
    );
  }

  const template = getTemplate(session.template_id);
  const expired = new Date(session.deadline).getTime() <= Date.now();
  const locked = session.status === "closed" || expired;

  if (locked || !template) {
    return (
      <div className="container-narrow">
        <div className="card">
          <h1 className="text-lg font-semibold">此 Retro 已結束</h1>
          <p className="mt-2 text-sm text-muted">
            {session.status === "closed"
              ? "發起者已結束這場 session。"
              : "已超過截止時間，表單已鎖定。"}
          </p>
          <a className="btn-primary mt-4" href={`/s/${session.id}/results`}>
            查看結果
          </a>
        </div>
      </div>
    );
  }

  // Named sessions: load the roster so the filler can pick who they are.
  let roster: RosterMember[] = [];
  if (session.anonymity === "named") {
    const { data: participants } = await supabase
      .from("retro_participants")
      .select("id, display_name, submitted_at")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });
    roster = (participants ?? []).map((p) => ({
      id: p.id,
      display_name: p.display_name,
      submitted: !!p.submitted_at,
    }));
  }

  return (
    <div className="container-narrow">
      <BackButton fallback="/" label="返回" />
      <FillWizard
        sessionId={session.id}
        anonymity={session.anonymity}
        templateName={template.name}
        templateDescription={template.description}
        questions={template.questions}
        roster={roster}
        allowAdhoc={session.allow_adhoc}
      />
    </div>
  );
}
