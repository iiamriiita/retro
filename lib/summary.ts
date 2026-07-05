import { getTemplate } from "./templates";
import type { Locale } from "./i18n/messages";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export type ReportTone = "neutral" | "balanced" | "playful";
export type ReportSection = "themes" | "well" | "improve" | "actions";
export const ALL_SECTIONS: ReportSection[] = [
  "themes",
  "well",
  "improve",
  "actions",
];

const SECTIONS_ZH: Record<ReportSection, { h: string; d: string }> = {
  themes: { h: "主題歸納", d: "歸納大家共同提到的 2–4 個主題。" },
  well: { h: "正向亮點", d: "團隊做得好、值得延續的地方。" },
  improve: { h: "待改善點", d: "需要調整的問題，對事不對人。" },
  actions: {
    h: "具體調整方向建議",
    d: "可行動的 next steps，越具體越好（例如「站會限制在 15 分鐘、超時的議題移到會後」）。",
  },
};
const SECTIONS_EN: Record<ReportSection, { h: string; d: string }> = {
  themes: { h: "Themes", d: "Group the 2–4 themes people commonly raised." },
  well: {
    h: "What's going well",
    d: "What the team does well and should keep doing.",
  },
  improve: {
    h: "What to improve",
    d: "Issues to adjust — about the work, not the people.",
  },
  actions: {
    h: "Concrete next steps",
    d: 'Actionable next steps, as specific as possible (e.g. "cap stand-ups at 15 minutes and move overflow topics to after the meeting").',
  },
};

const TONE_ZH: Record<ReportTone, string> = {
  neutral: "語氣：中性、專業、精簡。",
  balanced: "語氣：清楚專業，帶一點溫度與鼓勵，但不油腔滑調。",
  playful:
    "語氣：輕鬆、溫暖、帶點幽默。可以借用這場 retro 模板的比喻（例如航行、花園、太空任務）來包裝標題與描述，但內容仍要具體可行。",
};
const TONE_EN: Record<ReportTone, string> = {
  neutral: "Tone: neutral, professional, concise.",
  balanced:
    "Tone: clear and professional with a bit of warmth and encouragement — not cheesy.",
  playful:
    "Tone: light, warm, a little playful. Feel free to lean on the retro template's metaphor (sailing / garden / space mission) in headings and phrasing, while keeping the content concrete and actionable.",
};

export type StructuredReport = {
  summary?: string;
  well?: string[];
  improve?: string[];
  actions?: string[];
};

const FIELD_ZH: Record<ReportSection, string> = {
  themes: "summary：用「一句話」總結這場 retro 的整體重點。",
  well: "well：2–4 條短句，團隊做得好、值得延續的地方。",
  improve: "improve：2–4 條短句，需要調整的問題（對事不對人）。",
  actions: "actions：2–3 條短句，具體、可行動的調整方向。",
};
const FIELD_EN: Record<ReportSection, string> = {
  themes: "summary: ONE sentence capturing the overall takeaway of this retro.",
  well: "well: 2–4 short bullet strings — what's going well, worth keeping.",
  improve:
    "improve: 2–4 short bullet strings — what to improve (about the work, not people).",
  actions:
    "actions: 2–3 short bullet strings — concrete, specific next steps.",
};

export function summarySystem(
  locale: Locale,
  tone: ReportTone = "neutral",
  sections: ReportSection[] = ALL_SECTIONS,
): string {
  const chosen = sections.length > 0 ? sections : ALL_SECTIONS;
  if (locale === "en") {
    const fields = chosen.map((k) => `- ${FIELD_EN[k]}`).join("\n");
    return `You are an AI assistant for a team retrospective. You'll receive all the answers from one retro (de-identified, text only). Analyse them and return a JSON object with ONLY these fields:

${fields}

Principles: about the work not the person, specific, actionable. Reflect the answers faithfully; don't invent things that weren't said. Keep each bullet to one short sentence. Write all text in English.

${TONE_EN[tone]}`;
  }
  const fields = chosen.map((k) => `- ${FIELD_ZH[k]}`).join("\n");
  return `你是一個團隊 retro（回顧會議）的 AI 助理。你會收到一場 retro 的所有回答（已去識別化，只有文字）。請分析後回傳一個 JSON 物件，只包含這些欄位：

${fields}

原則：對事不對人、具體、可行動。忠實反映回答內容，不要杜撰沒有出現的事。每一條保持一句短句。所有文字用繁體中文。

${TONE_ZH[tone]}`;
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

// One-shot Gemini summary → JSON string of a StructuredReport. Throws on failure.
export async function geminiSummary(
  context: string,
  locale: Locale = "en",
  tone: ReportTone = "neutral",
  sections: ReportSection[] = ALL_SECTIONS,
  note = "",
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    throw new Error(
      locale === "en"
        ? "GEMINI_API_KEY is not set; cannot generate the AI report."
        : "尚未設定 GEMINI_API_KEY，無法產生 AI 報告。",
    );

  const chosen = sections.length > 0 ? sections : ALL_SECTIONS;
  const intro =
    locale === "en"
      ? `${summarySystem(locale, tone, chosen)}\n\nHere are all the answers from this retro (de-identified):\n\n${context}`
      : `${summarySystem(locale, tone, chosen)}\n\n以下是這場 retro 的所有回答（已去識別化）：\n\n${context}`;
  const noteLine = note
    ? locale === "en"
      ? `\n\nExtra guidance from the organizer (weigh this, but stay faithful to the answers): ${note}`
      : `\n\n主辦者的額外指引（請參考，但仍要忠實反映回答）：${note}`
    : "";
  const ask =
    (locale === "en"
      ? "Produce the JSON report from the answers above."
      : "請根據以上回答產生 JSON 報告。") + noteLine;

  // Build a response schema with only the requested fields.
  const props: Record<string, unknown> = {};
  if (chosen.includes("themes")) props.summary = { type: "STRING" };
  if (chosen.includes("well"))
    props.well = { type: "ARRAY", items: { type: "STRING" } };
  if (chosen.includes("improve"))
    props.improve = { type: "ARRAY", items: { type: "STRING" } };
  if (chosen.includes("actions"))
    props.actions = { type: "ARRAY", items: { type: "STRING" } };
  const responseSchema = { type: "OBJECT", properties: props };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: intro }] },
      contents: [{ role: "user", parts: [{ text: ask }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 2600,
        responseMimeType: "application/json",
        responseSchema,
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    if (res.status === 429)
      throw new Error(
        locale === "en"
          ? "The AI is over its usage quota right now. Please try again in a little while."
          : "AI 目前已超過用量額度，請稍後再試（Gemini 免費額度有限）。",
      );
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
  // Clean up: strip any ```json fences and keep the outermost JSON object.
  let clean = reply.trim();
  if (clean.startsWith("```")) {
    clean = clean
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
  }
  const first = clean.indexOf("{");
  const last = clean.lastIndexOf("}");
  if (first >= 0 && last > first) clean = clean.slice(first, last + 1);

  try {
    JSON.parse(clean);
  } catch {
    throw new Error(
      locale === "en"
        ? "The AI returned malformed output — please try again."
        : "AI 回傳格式有誤，請再試一次。",
    );
  }
  return clean;
}
