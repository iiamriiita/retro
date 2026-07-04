import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getTemplates } from "@/lib/templates";
import { getT } from "@/lib/i18n/server";
import CreateWizard from "@/components/CreateWizard";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { locale, t } = await getT();

  return (
    <div className="container-narrow">
      <BackButton fallback="/dashboard" label={t("new.back")} />
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("new.title")}
        </h1>
        <p className="mt-2 text-sm text-muted">{t("new.desc")}</p>
      </div>
      <CreateWizard templates={getTemplates(locale)} />
    </div>
  );
}
