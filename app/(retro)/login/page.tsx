import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getT } from "@/lib/i18n/server";
import AuthModal from "@/components/AuthModal";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const { t } = await getT();
  return (
    <div className="container-narrow">
      <div className="card flex items-center justify-between">
        <p className="text-sm text-muted">{t("login.prompt")}</p>
        <div className="flex gap-2">
          <AuthModal label={t("nav.login")} variant="nav" defaultTab="login" />
          <AuthModal
            label={t("am.register")}
            variant="primary"
            defaultTab="register"
          />
        </div>
      </div>
    </div>
  );
}
