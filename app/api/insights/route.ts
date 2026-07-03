import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getLocale } from "@/lib/i18n/server";
import { geminiInsights, type RetroForAI } from "@/lib/insights";

export const runtime = "nodejs";

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

// Owner-only: analyse all of the user's finished retros across time and cache
// the result. Triggered by the "用 AI 生成洞察" button on the dashboard.
export async function POST() {
  const user = await getCurrentUser();
  const locale = await getLocale();
  const en = locale === "en";
  if (!user)
    return NextResponse.json(
      { error: en ? "Please log in first" : "請先登入" },
      { status: 401 },
    );

  const supabase = createServiceClient();

  const { data: sessions } = await supabase
    .from("retro_sessions")
    .select("id, template_id, status, deadline, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  const now = Date.now();
  const finished = (sessions ?? []).filter(
    (s) => s.status === "closed" || new Date(s.deadline).getTime() <= now,
  );
  if (finished.length === 0) {
    return NextResponse.json(
      {
        error: en
          ? "You need at least one finished retro to analyze."
          : "需要至少一場已結束的 retro 才能分析。",
      },
      { status: 400 },
    );
  }

  // Pull answers for those sessions and group them per retro.
  const ids = finished.map((s) => s.id);
  const { data: answers } = await supabase
    .from("retro_answers")
    .select("session_id, question_key, content")
    .in("session_id", ids);

  const byId = new Map<string, RetroForAI>();
  for (const s of finished) {
    byId.set(s.id, {
      dateLabel: fmtDate(s.created_at),
      templateId: s.template_id,
      answers: [],
    });
  }
  for (const a of answers ?? []) {
    byId.get(a.session_id)?.answers.push({
      question_key: a.question_key,
      content: a.content,
    });
  }

  // Keep only retros that actually have answers; cap at the last 8 for cost.
  const retros = finished
    .map((s) => byId.get(s.id)!)
    .filter((r) => r.answers.length > 0)
    .slice(-8);

  if (retros.length === 0) {
    return NextResponse.json(
      {
        error: en
          ? "Your finished retros have no answers yet, so there's nothing to analyze."
          : "已結束的 retro 還沒有任何回答，無法分析。",
      },
      { status: 400 },
    );
  }

  try {
    const data = await geminiInsights(retros, locale);
    const generated_at = new Date().toISOString();
    const { error } = await supabase
      .from("retro_team_insights")
      .upsert({ owner_id: user.id, data, generated_at });
    if (error) throw new Error(en ? "Failed to save insights" : "儲存洞察失敗");
    return NextResponse.json({ ok: true, data, generated_at });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : en
              ? "Generation failed"
              : "產生失敗",
      },
      { status: 502 },
    );
  }
}

