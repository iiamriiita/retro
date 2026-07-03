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
    .select("id, anonymity, discussion_enabled")
    .eq("id", session_id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Commenting is only allowed once the owner has opened discussion.
  if (!session.discussion_enabled) {
    return NextResponse.json(
      { error: "討論尚未開啟。" },
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

  // Discussion identity is chosen by the commenter (name or anonymous) via the
  // popup — independent of the session's answer anonymity.
  const authorName = (body.author_name ?? "").trim() || null;

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
