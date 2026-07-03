import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import FillWizard from "@/components/FillWizard";
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

  if (!template) {
    return (
      <div className="container-narrow">
        <BackButton fallback="/" label="返回" />
        <div className="card">
          <h1 className="text-lg font-semibold">找不到問卷</h1>
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="container-narrow space-y-5">
        <BackButton fallback="/" label="返回" />
        <div className="card bg-gray-50">
          <h1 className="text-lg font-semibold">此 Retro 已結束</h1>
          <p className="mt-2 text-sm text-muted">
            {session.status === "closed"
              ? "發起者已結束這場 session，表單已鎖定。"
              : "已超過截止時間，表單已鎖定。"}
          </p>
          <a className="btn-primary mt-4" href={`/s/${session.id}/results`}>
            查看結果
          </a>
        </div>

        {/* Locked (read-only) view of the original questionnaire */}
        <div>
          <h2 className="text-lg font-semibold">{template.name}</h2>
          <p className="mt-1 text-sm text-muted">{template.description}</p>
          <div className="mt-4 space-y-3 opacity-70">
            {template.questions.map((q) => (
              <div key={q.key} className="card">
                <label className="field-label">{q.label}</label>
                <textarea
                  rows={3}
                  disabled
                  className="textarea cursor-not-allowed bg-gray-50"
                  placeholder={q.placeholder}
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">🔒 表單已鎖定，無法再填寫。</p>
        </div>
      </div>
    );
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
      />
    </div>
  );
}
