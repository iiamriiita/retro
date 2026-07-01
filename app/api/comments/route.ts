import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { PublicComment } from "@/lib/types";

export const runtime = "nodejs";

interface CommentBody {
  session_id?: string;
  answer_id?: string;
  quote?: string;
  quote_start?: number;
  quote_end?: number;
  body?: string;
  author_name?: string;
}

export async function POST(req: Request) {
  let body: CommentBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { session_id, answer_id, quote, quote_start, quote_end } = body;
  const text = (body.body ?? "").trim();

  if (
    !session_id ||
    !answer_id ||
    typeof quote !== "string" ||
    typeof quote_start !== "number" ||
    typeof quote_end !== "number" ||
    quote_end <= quote_start ||
    !text
  ) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: session } = await supabase
    .from("retro_sessions")
    .select("id, anonymity, status, deadline")
    .eq("id", session_id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Comments are only allowed once results are viewable (closed or past deadline).
  const viewable =
    session.status === "closed" ||
    new Date(session.deadline).getTime() <= Date.now();
  if (!viewable) {
    return NextResponse.json(
      { error: "session 尚未結束，還不能留言。" },
      { status: 409 },
    );
  }

  // The answer must belong to this session.
  const { data: answer } = await supabase
    .from("retro_answers")
    .select("id")
    .eq("id", answer_id)
    .eq("session_id", session_id)
    .single();
  if (!answer) {
    return NextResponse.json({ error: "找不到對應的回答" }, { status: 400 });
  }

  // Anonymity is enforced here: no author name is ever stored in anonymous mode.
  const authorName =
    session.anonymity === "anonymous"
      ? null
      : (body.author_name ?? "").trim() || null;

  const { data: inserted, error } = await supabase
    .from("retro_comments")
    .insert({
      session_id,
      answer_id,
      quote: quote.slice(0, 2000),
      quote_start,
      quote_end,
      body: text.slice(0, 4000),
      author_name: authorName,
    })
    .select("id, answer_id, quote, quote_start, quote_end, body, author_name, created_at")
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: "留言失敗" }, { status: 500 });
  }

  return NextResponse.json({ comment: inserted as PublicComment });
}
