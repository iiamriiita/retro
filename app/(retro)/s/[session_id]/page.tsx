import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import { getT } from "@/lib/i18n/server";
import FillWizard from "@/components/FillWizard";

export const dynamic = "force-dynamic";

export default async function FillPage({
  params,
}: {
  params: Promise<{ session_id: string }>;
}) {
  const { session_id } = await params;
  const supabase = createServiceClient();
  const { locale, t } = await getT();

  const { data: session } = await supabase
    .from("retro_sessions")
    .select("id, name, owner_id, template_id, anonymity, status, deadline")
    .eq("id", session_id)
    .single();

  if (!session) {
    return (
      <div className="container-narrow">
        <div className="card">
          <h1 className="text-lg font-semibold">{t("fill.notFound")}</h1>
          <p className="mt-2 text-sm text-muted">{t("fill.notFoundDesc")}</p>
        </div>
      </div>
    );
  }

  const template = getTemplate(session.template_id, locale);
  const expired = new Date(session.deadline).getTime() <= Date.now();
  const locked = session.status === "closed" || expired;

  if (!template) {
    return (
      <div className="container-narrow">
        <div className="card">
          <h1 className="text-lg font-semibold">{t("fill.noTemplate")}</h1>
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="container-narrow space-y-5">
        <div className="card bg-gray-50">
          <h1 className="text-lg font-semibold">{t("fill.endedTitle")}</h1>
          <p className="mt-2 text-sm text-muted">
            {session.status === "closed"
              ? t("fill.endedClosed")
              : t("fill.endedExpired")}
          </p>
          <a className="btn-primary mt-4" href={`/s/${session.id}/results`}>
            {t("fill.viewResults")}
          </a>
        </div>

        {/* Locked (read-only) view of the original questionnaire */}
        <div>
          <h2 className="text-lg font-semibold">
            {session.name || template.name}
          </h2>
          <p className="mt-1 text-sm text-muted">{template.description}</p>
          <div className="mt-4 space-y-3 opacity-70">
            {template.questions
              .filter((q) => q.type !== "rating" && q.type !== "role")
              .map((q) => (
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
          <p className="mt-3 text-xs text-muted">{t("fill.locked")}</p>
        </div>
      </div>
    );
  }

  // Personalised fill-page invitation: substitute the organizer's team name.
  const { data: team } = await supabase
    .from("retro_teams")
    .select("name")
    .eq("owner_id", session.owner_id)
    .maybeSingle();
  const teamName =
    (team?.name ?? "").trim() || (locale === "en" ? "the team" : "團隊");
  const invite = (template.invite ?? template.description).replace(
    /\{team\}/g,
    teamName,
  );

  return (
    <div className="container-narrow">
      <FillWizard
        sessionId={session.id}
        templateId={session.template_id}
        anonymity={session.anonymity}
        templateName={session.name || template.name}
        templateDescription={invite}
        questions={template.questions}
      />
    </div>
  );
}
