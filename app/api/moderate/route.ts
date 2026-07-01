import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkBlocklist } from "@/lib/blocklist";
import type { ModerateResult } from "@/lib/types";

export const runtime = "nodejs";

const MODEL = "claude-haiku-4-5-20251001";

// System prompt — verbatim from the moderation spec. The gatekeeper's ONLY job
// is to decide "send as-is (ok)" vs "please rewrite (revise)", defaulting to ok.
const SYSTEM_PROMPT = `你是一個團隊 retro（回顧會議）工具的回饋守門員。你的唯一工作，是判斷一段成員寫給隊友的回饋文字，是否「可以送出」，或「應該請對方重寫」。

你只做守門，不改寫、不評分、不總結。

# 你的判準

一段回饋「可放行（ok）」，只要它沒有以下任一問題。你的預設立場是放行——批評、負面、失望的內容都可以放行，只要它對事、留有讓對方改進的空間。

請求重寫（revise）僅限以下三種情況：

1. insulting（人身侮辱）
   針對「人本身」而非「行為或結果」的攻擊、貶低、羞辱、髒話罵人、嘲諷人格或能力。
   例：「你就是很廢」「白痴才會這樣做」——這是攻擊人，不是回饋行為。

2. non_constructive（無建設性）
   有抱怨或評價，但完全沒有指出「發生了什麼具體行為/情境」，也沒有任何可改進的方向，讓收到的人無從下手。
   例：「爛透了」「不知道在幹嘛」——沒有具體事件、沒有方向。

3. purely_emotional（純情緒宣洩且無資訊量）
   整段只有情緒表達，沒有承載任何可用資訊。
   注意：情緒本身不是問題。「我那時候很挫折，因為 code review 等了三天沒回應」是好回饋——它有情緒也有具體事實與方向，應放行。只有「當一段話幾乎只剩情緒、拿掉情緒後什麼資訊都不剩」時，才算 purely_emotional。

# 重要原則（避免誤判）

- 對事不對人的嚴厲批評 → 放行。例：「這次 PR 太大，一次改了 40 個檔案，我 review 不完，希望之後能拆小」→ ok。
- 直白、不客氣但指向具體行為 → 放行。語氣直接不是重寫理由。
- 讚美、正向回饋 → 一律 ok。
- 空白或極短但仍是有效回答（如「沒有特別想到」）→ ok，不要強迫。
- 有髒話但不是用來罵「人」（如「這個 bug 真的很靠北」形容事情）→ 傾向放行，除非同時構成人身攻擊。
- 語言可能是中文、英文或混雜，一律適用同樣標準。

# 當你判定 revise 時

\`suggestion\` 要用第二人稱、友善、像協助而非指責的語氣，並具體告訴對方「補上什麼」就能送出。指出缺的是「具體事件」還是「可改進方向」。不要說教，一句話即可。

# 輸出格式

只輸出 JSON，不要有任何其他文字、說明或 markdown 標記。格式：

{
  "verdict": "ok" 或 "revise",
  "reasons": [] 或包含 "insulting" / "non_constructive" / "purely_emotional" 的陣列,
  "suggestion": verdict 為 ok 時給空字串 ""；為 revise 時給一句中文引導
}`;

// A few-shot exchange to stabilise the JSON output.
const FEWSHOT: Anthropic.MessageParam[] = [
  { role: "user", content: "你根本就是團隊的累贅，什麼都做不好。" },
  {
    role: "assistant",
    content:
      '{"verdict":"revise","reasons":["insulting"],"suggestion":"這句是在評價人，而不是行為。試著改成某個具體情境下你希望對方怎麼調整，會更有幫助 🙂"}',
  },
  { role: "user", content: "爛死了，不想講。" },
  {
    role: "assistant",
    content:
      '{"verdict":"revise","reasons":["non_constructive","purely_emotional"],"suggestion":"聽起來你有些不滿——可以補上是哪件事、當下發生什麼，以及你希望怎麼改變嗎？這樣對方才知道怎麼調整。"}',
  },
  {
    role: "user",
    content: "站會常常拖到 40 分鐘，後面的人時間被壓縮，希望能控制在 15 分鐘內。",
  },
  { role: "assistant", content: '{"verdict":"ok","reasons":[],"suggestion":""}' },
];

// Fallback used whenever the LLM is unavailable / errors / times out: degrade to
// the keyword list and, absent a hit, allow. Never block the user on our outage.
function degrade(text: string): ModerateResult {
  const { hit } = checkBlocklist(text);
  if (hit) {
    return {
      verdict: "revise",
      reasons: ["insulting"],
      suggestion:
        "這裡出現了比較像人身攻擊的字眼。試著把焦點放在具體行為與你希望的調整，會更有幫助 🙂",
    };
  }
  return { verdict: "ok", reasons: [], suggestion: "" };
}

function isModerateResult(v: unknown): v is ModerateResult {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    (o.verdict === "ok" || o.verdict === "revise") &&
    Array.isArray(o.reasons) &&
    typeof o.suggestion === "string"
  );
}

export async function POST(req: Request) {
  let text = "";
  try {
    const body = await req.json();
    text = typeof body?.text === "string" ? body.text : "";
  } catch {
    return NextResponse.json(
      { verdict: "ok", reasons: [], suggestion: "" } satisfies ModerateResult,
      { status: 200 },
    );
  }

  const trimmed = text.trim();
  // Empty / very short answers are valid — don't force anything.
  if (trimmed.length === 0) {
    return NextResponse.json({
      verdict: "ok",
      reasons: [],
      suggestion: "",
    } satisfies ModerateResult);
  }

  // Fast path: obvious personal insult → revise without an LLM call.
  const blocked = checkBlocklist(trimmed);
  if (blocked.hit) {
    return NextResponse.json({
      verdict: "revise",
      reasons: ["insulting"],
      suggestion:
        "這裡出現了比較像人身攻擊的字眼。試著把焦點放在具體行為與你希望的調整，會更有幫助 🙂",
    } satisfies ModerateResult);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No key configured → degrade gracefully instead of blocking.
    return NextResponse.json(degrade(trimmed));
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 300,
        temperature: 0.2,
        system: SYSTEM_PROMPT,
        messages: [...FEWSHOT, { role: "user", content: trimmed }],
      },
      { timeout: 12_000 },
    );

    const raw = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const parsed = JSON.parse(raw);
    if (isModerateResult(parsed)) {
      return NextResponse.json(parsed);
    }
    return NextResponse.json(degrade(trimmed));
  } catch {
    // Timeout / parse error / API error → degrade + allow.
    return NextResponse.json(degrade(trimmed));
  }
}
