import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import { checkBlocklist } from "@/lib/blocklist";

export const runtime = "nodejs";

interface AnswerInput {
  question_key: string;
  content: string;
}
interface SubmitBody {
  session_id?: string;
  display_name?: string;
  answers?: AnswerInput[];
}

export async function POST(req: Request) {
  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.session_id || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: session, error } = await supabase
    .from("retro_sessions")
    .select("id, template_id, anonymity, status, deadline")
    .eq("id", body.session_id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Writable only while open AND not past deadline.
  const expired = new Date(session.deadline).getTime() <= Date.now();
  if (session.status !== "open" || expired) {
    return NextResponse.json(
      { error: "此 session 已結束或已過截止時間，無法再填寫。" },
      { status: 409 },
    );
  }

  const template = getTemplate(session.template_id);
  if (!template) {
    return NextResponse.json({ error: "Template missing" }, { status: 500 });
  }
  const validKeys = new Set(template.questions.map((q) => q.key));

  // Named mode requires a display name.
  const displayName =
    session.anonymity === "named" ? (body.display_name ?? "").trim() : null;
  if (session.anonymity === "named" && !displayName) {
    return NextResponse.json({ error: "請先填寫暱稱。" }, { status: 400 });
  }

  // Keep only valid, non-empty answers.
  const rows = body.answers
    .filter((a) => validKeys.has(a.question_key) && a.content?.trim())
    .map((a) => ({ question_key: a.question_key, content: a.content.trim() }));

  if (rows.length === 0) {
    return NextResponse.json({ error: "沒有可送出的內容。" }, { status: 400 });
  }

  // Hard server-side gate against blatant personal insults (defence in depth —
  // the client already runs moderation, this stops a bypassed request).
  for (const r of rows) {
    if (checkBlocklist(r.content).hit) {
      return NextResponse.json(
        {
          error:
            "有內容包含人身攻擊字眼，請調整為對事不對人的回饋後再送出。",
          question_key: r.question_key,
        },
        { status: 422 },
      );
    }
  }

  // Create the participant, then the answers.
  const { data: participant, error: pErr } = await supabase
    .from("retro_participants")
    .insert({ session_id: session.id, display_name: displayName })
    .select("id")
    .single();

  if (pErr || !participant) {
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  const { error: aErr } = await supabase.from("retro_answers").insert(
    rows.map((r) => ({
      session_id: session.id,
      participant_id: participant.id,
      question_key: r.question_key,
      content: r.content,
    })),
  );

  if (aErr) {
    return NextResponse.json({ error: "Could not save answers" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
