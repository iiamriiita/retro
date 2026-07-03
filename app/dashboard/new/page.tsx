import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { TEMPLATES } from "@/lib/templates";
import CreateWizard from "@/components/CreateWizard";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="container-narrow">
      <BackButton fallback="/dashboard" label="返回 Dashboard" />
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">發起一場 Retro</h1>
        <p className="mt-2 text-sm text-muted">
          選一套問卷、產生分享連結，讓 2–5 人的小組互相給回饋。
        </p>
      </div>
      <CreateWizard templates={TEMPLATES} />
    </div>
  );
}
