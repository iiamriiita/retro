import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { buildContext, geminiSummary } from "@/lib/summary";

export const runtime = "nodejs";

// Owner-only: generate the AI report from all answers and persist it so shared
// viewers can read it.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: session } = await supabase
    .from("retro_sessions")
    .select("id, owner_id, template_id, status, deadline")
    .eq("id", id)
    .single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.owner_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const viewable =
    session.status === "closed" ||
    new Date(session.deadline).getTime() <= Date.now();
  if (!viewable) {
    return NextResponse.json(
      { error: "請先結束 session 再生成報告。" },
      { status: 409 },
    );
  }

  const { data: answers } = await supabase
    .from("retro_answers")
    .select("question_key, content")
    .eq("session_id", session.id);
  if (!answers || answers.length === 0) {
    return NextResponse.json({ error: "這場還沒有任何回答。" }, { status: 400 });
  }

  try {
    const report = await geminiSummary(buildContext(session.template_id, answers));
    const { error } = await supabase
      .from("retro_sessions")
      .update({ ai_report: report, ai_report_at: new Date().toISOString() })
      .eq("id", session.id);
    if (error) throw new Error("儲存報告失敗");
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "產生失敗" },
      { status: 502 },
    );
  }
}
