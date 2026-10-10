import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { createServiceClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import Icon from "@/components/Icon";
import TeamSettingsClient from "@/components/TeamSettingsClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { t } = await getT();
  const supabase = createServiceClient();

  const { data: team } = await supabase
    .from("retro_teams")
    .select("name, team_size")
    .eq("owner_id", user.id)
    .maybeSingle();

  const { count } = await supabase
    .from("retro_sessions")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  return (
    <main className="mx-auto max-w-[760px] px-4 py-9">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <Icon name="arrow-left" size={15} />
        {t("cw.backDashboard")}
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">
        {t(team ? "team.editTitle" : "team.onboardTitle")}
      </h1>
      <TeamSettingsClient
        initialName={team?.name ?? ""}
        initialSize={team?.team_size ?? null}
        sessionCount={count ?? 0}
      />
    </main>
  );
}
