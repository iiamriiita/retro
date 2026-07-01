import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import FillForm from "@/components/FillForm";

export const dynamic = "force-dynamic";

export default async function FillPage({
  params,
}: {
  params: Promise<{ session_id: string }>;
}) {
  const { session_id } = await params;
  const supabase = createServiceClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, template_id, anonymity, status, deadline")
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
          <a
            className="btn-primary mt-4"
            href={`/s/${session.id}/results`}
          >
            查看結果
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container-narrow">
      <FillForm
        sessionId={session.id}
        anonymity={session.anonymity}
        deadline={session.deadline}
        templateName={template.name}
        templateDescription={template.description}
        questions={template.questions}
      />
    </div>
  );
}
