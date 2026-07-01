import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import type { ChatTurn } from "@/lib/types";

export const runtime = "nodejs";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SUMMARY_SYSTEM = `你是一個團隊 retro（回顧會議）的 AI 助理。你會收到一場 retro 的所有回答（已去識別化，只有文字）。

請用繁體中文、以 markdown 輸出，幫團隊做總結。第一次回覆時，固定包含這四個部分（用二級標題 ##）：

## 主題歸納
歸納大家共同提到的 2–4 個主題。

## 正向亮點
團隊做得好、值得延續的地方。

## 待改善點
需要調整的問題，對事不對人。

## 具體調整方向建議
可行動的 next steps，越具體越好（例如「站會限制在 15 分鐘、超時的議題移到會後」）。

原則：對事不對人、具體、可行動。忠實反映回答內容，不要杜撰沒有出現的事。若使用者接著追問，就針對追問簡潔回答，不需要每次都重印四個標題。`;

function buildContext(
  templateId: string,
  answers: { question_key: string; content: string }[],
): string {
  const template = getTemplate(templateId);
  const questions = template?.questions ?? [];
  const lines: string[] = [];
  for (const q of questions) {
    const group = answers.filter((a) => a.question_key === q.key);
    lines.push(`### ${q.label}`);
    if (group.length === 0) {
      lines.push("（沒有回答）");
    } else {
      for (const a of group) lines.push(`- ${a.content}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export async function POST(req: Request) {
  let body: { session_id?: string; messages?: ChatTurn[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.session_id) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "尚未設定 GEMINI_API_KEY，無法產生 AI 總結。" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const { data: session } = await supabase
    .from("retro_sessions")
    .select("id, template_id, status, deadline")
    .eq("id", body.session_id)
    .single();
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const viewable =
    session.status === "closed" ||
    new Date(session.deadline).getTime() <= Date.now();
  if (!viewable) {
    return NextResponse.json(
      { error: "session 尚未結束，還不能產生總結。" },
      { status: 409 },
    );
  }

  // De-identified: only question_key + content leave the DB, never author info.
  const { data: answers } = await supabase
    .from("retro_answers")
    .select("question_key, content")
    .eq("session_id", session.id);

  if (!answers || answers.length === 0) {
    return NextResponse.json(
      { error: "這場還沒有任何回答，無法總結。" },
      { status: 400 },
    );
  }

  const context = buildContext(session.template_id, answers);

  // Client owns the conversation; on first call it sends a single seed user turn.
  const turns: ChatTurn[] =
    body.messages && body.messages.length > 0
      ? body.messages
      : [{ role: "user", text: "請根據以上回答，幫我們產生總結與建議。" }];

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: `${SUMMARY_SYSTEM}\n\n以下是這場 retro 的所有回答（已去識別化）：\n\n${context}`,
            },
          ],
        },
        contents: turns.map((t) => ({
          role: t.role,
          parts: [{ text: t.text }],
        })),
        generationConfig: { temperature: 0.4, maxOutputTokens: 1400 },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("gemini summarize failed", res.status, detail);
      return NextResponse.json(
        { error: `AI 服務錯誤（${res.status}）：${detail.slice(0, 400)}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const reply: string =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("")
        .trim() ?? "";

    if (!reply) {
      return NextResponse.json(
        { error: "AI 沒有回覆內容，請再試一次。" },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: "AI 產生總結逾時或失敗，請稍後再試。" },
      { status: 502 },
    );
  }
}
