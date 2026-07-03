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
  participant_id?: string; // named: chosen from roster
  display_name?: string; // named ad-hoc, or ignored for anonymous
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
    .select("id, template_id, anonymity, status, deadline, allow_adhoc")
    .eq("id", body.session_id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

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

  const rows = body.answers
    .filter((a) => validKeys.has(a.question_key) && a.content?.trim())
    .map((a) => ({ question_key: a.question_key, content: a.content.trim() }));

  if (rows.length === 0) {
    return NextResponse.json({ error: "沒有可送出的內容。" }, { status: 400 });
  }

  // Server-side hard gate against blatant personal insults.
  for (const r of rows) {
    if (checkBlocklist(r.content).hit) {
      return NextResponse.json(
        {
          error: "有內容包含人身攻擊字眼，請調整為對事不對人的回饋後再送出。",
          question_key: r.question_key,
        },
        { status: 422 },
      );
    }
  }

  // Resolve the participant.
  let participantId: string;

  if (session.anonymity === "anonymous") {
    const { data: p, error: pErr } = await supabase
      .from("retro_participants")
      .insert({ session_id: session.id, display_name: null, submitted_at: new Date().toISOString() })
      .select("id")
      .single();
    if (pErr || !p) {
      return NextResponse.json({ error: "Could not save" }, { status: 500 });
    }
    participantId = p.id;
  } else if (body.participant_id) {
    // Named: chosen from the roster. Must belong to the session and be unfilled.
    const { data: p } = await supabase
      .from("retro_participants")
      .select("id, submitted_at")
      .eq("id", body.participant_id)
      .eq("session_id", session.id)
      .single();
    if (!p) {
      return NextResponse.json({ error: "找不到這位成員" }, { status: 400 });
    }
    if (p.submitted_at) {
      return NextResponse.json(
        { error: "這位成員已經填過了。" },
        { status: 409 },
      );
    }
    await supabase
      .from("retro_participants")
      .update({ submitted_at: new Date().toISOString() })
      .eq("id", p.id);
    participantId = p.id;
  } else {
    // Named ad-hoc: add a new participant, if allowed.
    const name = (body.display_name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "請先選擇你是誰。" }, { status: 400 });
    }
    if (!session.allow_adhoc) {
      return NextResponse.json(
        { error: "這場只允許名單上的成員填寫。" },
        { status: 403 },
      );
    }
    const { data: p, error: pErr } = await supabase
      .from("retro_participants")
      .insert({
        session_id: session.id,
        display_name: name,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (pErr || !p) {
      return NextResponse.json({ error: "Could not save" }, { status: 500 });
    }
    participantId = p.id;
  }

  const { error: aErr } = await supabase.from("retro_answers").insert(
    rows.map((r) => ({
      session_id: session.id,
      participant_id: participantId,
      question_key: r.question_key,
      content: r.content,
    })),
  );

  if (aErr) {
    return NextResponse.json({ error: "Could not save answers" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
