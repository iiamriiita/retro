import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { PublicComment } from "@/lib/types";

export const runtime = "nodejs";

interface CommentBody {
  session_id?: string;
  parent_id?: string; // set → this is a reply
  answer_id?: string; // required for top-level
  quote?: string;
  quote_start?: number;
  quote_end?: number;
  body?: string;
  author_name?: string;
}

const SELECT =
  "id, answer_id, parent_id, quote, quote_start, quote_end, body, author_name, created_at";

export async function POST(req: Request) {
  let body: CommentBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { session_id } = body;
  const text = (body.body ?? "").trim();
  if (!session_id || !text) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: session } = await supabase
    .from("retro_sessions")
    .select("id, discussion_enabled")
    .eq("id", session_id)
    .single();
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (!session.discussion_enabled) {
    return NextResponse.json({ error: "討論尚未開啟。" }, { status: 409 });
  }

  const authorName = (body.author_name ?? "").trim() || null;

  // ---- reply ----
  if (body.parent_id) {
    const { data: parent } = await supabase
      .from("retro_comments")
      .select("id, answer_id")
      .eq("id", body.parent_id)
      .eq("session_id", session_id)
      .single();
    if (!parent) {
      return NextResponse.json({ error: "找不到原留言" }, { status: 400 });
    }
    const { data: inserted, error } = await supabase
      .from("retro_comments")
      .insert({
        session_id,
        answer_id: parent.answer_id,
        parent_id: parent.id,
        quote: null,
        quote_start: null,
        quote_end: null,
        body: text.slice(0, 4000),
        author_name: authorName,
      })
      .select(SELECT)
      .single();
    if (error || !inserted) {
      return NextResponse.json({ error: "回覆失敗" }, { status: 500 });
    }
    return NextResponse.json({ comment: inserted as PublicComment });
  }

  // ---- top-level (anchored) ----
  const { answer_id, quote, quote_start, quote_end } = body;
  if (
    !answer_id ||
    typeof quote !== "string" ||
    typeof quote_start !== "number" ||
    typeof quote_end !== "number" ||
    quote_end <= quote_start
  ) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  const { data: answer } = await supabase
    .from("retro_answers")
    .select("id")
    .eq("id", answer_id)
    .eq("session_id", session_id)
    .single();
  if (!answer) {
    return NextResponse.json({ error: "找不到對應的回答" }, { status: 400 });
  }

  const { data: inserted, error } = await supabase
    .from("retro_comments")
    .insert({
      session_id,
      answer_id,
      parent_id: null,
      quote: quote.slice(0, 2000),
      quote_start,
      quote_end,
      body: text.slice(0, 4000),
      author_name: authorName,
    })
    .select(SELECT)
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: "留言失敗" }, { status: 500 });
  }
  return NextResponse.json({ comment: inserted as PublicComment });
}
