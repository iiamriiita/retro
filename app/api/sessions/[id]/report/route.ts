import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getLocale } from "@/lib/i18n/server";
import {
  ALL_SECTIONS,
  buildContext,
  geminiSummary,
  type ReportSection,
  type ReportTone,
} from "@/lib/summary";

export const runtime = "nodejs";

// Owner-only: generate the AI report from all answers and persist it so shared
// viewers can read it.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const locale = await getLocale();
  const en = locale === "en";
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { error: en ? "Please log in first" : "請先登入" },
      { status: 401 },
    );

  const supabase = createServiceClient();
  const { data: session } = await supabase
    .from("retro_sessions")
    .select("id, owner_id, template_id, status, deadline, anonymity")
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
      {
        error: en
          ? "End the session before generating the report."
          : "請先結束 session 再生成報告。",
      },
      { status: 409 },
    );
  }

  const { data: answers } = await supabase
    .from("retro_answers")
    .select("id, question_key, content, participant_id, created_at")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });
  if (!answers || answers.length === 0) {
    return NextResponse.json(
      { error: en ? "This retro has no answers yet." : "這場還沒有任何回答。" },
      { status: 400 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    tone?: string;
    sections?: string[];
    note?: string;
  };
  const tone: ReportTone =
    body.tone === "playful" || body.tone === "balanced"
      ? body.tone
      : "neutral";
  const sections: ReportSection[] = Array.isArray(body.sections)
    ? (ALL_SECTIONS.filter((k) => body.sections!.includes(k)) as ReportSection[])
    : ALL_SECTIONS;

  // Respondent index by first appearance (created_at order) — matches the
  // "Respondent N" numbering in the responses list below the report.
  const authorIdx = new Map<string, number>();
  for (const a of answers) {
    if (!authorIdx.has(a.participant_id))
      authorIdx.set(a.participant_id, authorIdx.size + 1);
  }

  // For named sessions, tag sources with the responder's name initial.
  const initialById = new Map<string, string>();
  if (session.anonymity !== "anonymous") {
    const { data: participants } = await supabase
      .from("retro_participants")
      .select("id, display_name")
      .eq("session_id", session.id);
    for (const p of participants ?? []) {
      const name = (p.display_name ?? "").trim();
      if (name) initialById.set(p.id, [...name][0]!.toUpperCase());
    }
  }

  const annotated = answers.map((a) => ({
    id: a.id,
    question_key: a.question_key,
    content: a.content,
    respondent: authorIdx.get(a.participant_id) ?? 0,
    label: initialById.get(a.participant_id),
  }));

  try {
    const { context, refs } = buildContext(
      session.template_id,
      annotated,
      locale,
    );
    const report = await geminiSummary(
      context,
      locale,
      tone,
      sections.length > 0 ? sections : ALL_SECTIONS,
      typeof body.note === "string" ? body.note.trim() : "",
      refs,
    );
    // Persist the report, and make sure the shared view now includes it —
    // a freshly generated report should light up automatically.
    const { data: cur } = await supabase
      .from("retro_sessions")
      .select("share_view")
      .eq("id", session.id)
      .single();
    const nextView = cur?.share_view === "raw" ? "both" : cur?.share_view;
    const { error } = await supabase
      .from("retro_sessions")
      .update({
        ai_report: report,
        ai_report_at: new Date().toISOString(),
        ...(nextView ? { share_view: nextView } : {}),
      })
      .eq("id", session.id);
    if (error) throw new Error(en ? "Failed to save report" : "儲存報告失敗");
    return NextResponse.json({ ok: true, report });
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
