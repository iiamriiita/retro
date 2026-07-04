import { getTemplate } from "./templates";
import type { Locale } from "./i18n/messages";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM_ZH = `你是一個團隊 retro（回顧會議）的 AI 助理。你會收到一場 retro 的所有回答（已去識別化，只有文字）。

請用繁體中文、以 markdown 輸出，幫團隊做總結，固定包含這四個部分（用二級標題 ##）：

## 主題歸納
歸納大家共同提到的 2–4 個主題。

## 正向亮點
團隊做得好、值得延續的地方。

## 待改善點
需要調整的問題，對事不對人。

## 具體調整方向建議
可行動的 next steps，越具體越好（例如「站會限制在 15 分鐘、超時的議題移到會後」）。

原則：對事不對人、具體、可行動。忠實反映回答內容，不要杜撰沒有出現的事。`;

const SYSTEM_EN = `You are an AI assistant for a team retrospective. You'll receive all the answers from one retro (de-identified, text only).

Write the summary in English as markdown, always with these four sections (use level-2 headings ##):

## Themes
Group the 2–4 themes people commonly raised.

## What's going well
What the team does well and should keep doing.

## What to improve
Issues to adjust — about the work, not the people.

## Concrete next steps
Actionable next steps, as specific as possible (e.g. "cap stand-ups at 15 minutes and move overflow topics to after the meeting").

Principles: about the work not the person, specific, actionable. Reflect the answers faithfully; don't invent things that weren't said.`;

export function summarySystem(locale: Locale): string {
  return locale === "en" ? SYSTEM_EN : SYSTEM_ZH;
}

export function buildContext(
  templateId: string,
  answers: { question_key: string; content: string }[],
  locale: Locale = "en",
): string {
  const template = getTemplate(templateId, locale);
  const questions = template?.questions ?? [];
  const lines: string[] = [];
  for (const q of questions) {
    if (q.type === "rating") continue;
    const group = answers.filter((a) => a.question_key === q.key);
    lines.push(`### ${q.label}`);
    if (group.length === 0)
      lines.push(locale === "en" ? "(no answer)" : "（沒有回答）");
    else for (const a of group) lines.push(`- ${a.content}`);
    lines.push("");
  }
  return lines.join("\n");
}

// One-shot Gemini summary. Throws on failure so the caller can report it.
export async function geminiSummary(
  context: string,
  locale: Locale = "en",
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    throw new Error(
      locale === "en"
        ? "GEMINI_API_KEY is not set; cannot generate the AI report."
        : "尚未設定 GEMINI_API_KEY，無法產生 AI 報告。",
    );

  const intro =
    locale === "en"
      ? `${summarySystem(locale)}\n\nHere are all the answers from this retro (de-identified):\n\n${context}`
      : `${summarySystem(locale)}\n\n以下是這場 retro 的所有回答（已去識別化）：\n\n${context}`;
  const ask =
    locale === "en"
      ? "Produce the summary and recommendations from the answers above."
      : "請根據以上回答產生總結與建議。";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: intro }] },
      contents: [{ role: "user", parts: [{ text: ask }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1400 },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      (locale === "en" ? "AI service error" : "AI 服務錯誤") +
        `（${res.status}）：${detail.slice(0, 300)}`,
    );
  }

  const data = await res.json();
  const reply: string =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim() ?? "";
  if (!reply)
    throw new Error(
      locale === "en"
        ? "The AI returned no content — please try again."
        : "AI 沒有回覆內容，請再試一次。",
    );
  return reply;
}
