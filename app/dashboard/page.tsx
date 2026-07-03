import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import { deriveState } from "@/lib/status";
import FormLinkButton from "@/components/FormLinkButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from("retro_sessions")
    .select(
      "id, template_id, anonymity, status, deadline, discussion_enabled, ai_report_at, created_at",
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container-wide">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">我的 Retro</h1>
          <p className="mt-1.5 text-sm text-muted">{user.email}</p>
        </div>
        <Link className="btn-primary" href="/dashboard/new">
          + 發起新 retro
        </Link>
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="card">
          <p className="text-sm text-muted">
            還沒有任何 retro。點右上角「發起新 retro」開始第一場。
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => {
            const state = deriveState({
              status: s.status,
              deadline: s.deadline,
              discussion_enabled: s.discussion_enabled,
              ai_report_at: s.ai_report_at,
            });
            const template = getTemplate(s.template_id);
            return (
              <li key={s.id} className="card flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[15px] font-bold">
                      {template?.name ?? s.template_id}
                    </span>
                    <span
                      className={
                        state.primary.tone === "open"
                          ? "badge badge-success"
                          : "badge"
                      }
                    >
                      {state.primary.label}
                    </span>
                    {state.badges.map((b) => (
                      <span key={b} className="badge badge-accent">
                        {b}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {s.anonymity === "anonymous" ? "匿名" : "具名"} · 截止{" "}
                    {new Date(s.deadline).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <FormLinkButton sessionId={s.id} />
                  <Link
                    className="btn-primary !py-1.5 text-xs"
                    href={`/s/${s.id}/results`}
                  >
                    管理 / 結果
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
