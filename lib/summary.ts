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
  well: "well：歸納「順利的部分」區塊的內容。若該區沒有真正正向的內容，回傳空陣列 []。",
  improve:
    "improve：歸納「問題與警訊」區塊的內容（每條是簡短、具體的一點）。",
  actions:
    "actions：具體、可執行的下一步——就算沒人明講，也可以從「問題與警訊」和「方向」區塊合理推導出來。",
};
const FIELD_EN: Record<ReportSection, string> = {
  themes: "summary: ONE sentence capturing the overall takeaway of this retro.",
  well: "well: bullets summarising the WENT WELL section. If that section has no genuinely positive content, return an empty array [].",
  improve:
    "improve: bullets summarising the PROBLEMS & WARNINGS section (each a short, specific point).",
  actions:
    "actions: concrete, specific next steps — derive them from the PROBLEMS and DIRECTION sections even if no one spelled them out.",
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

Principles: about the work not the person, specific, actionable. Reflect the answers faithfully; don't invent things that weren't said. Keep each bullet to one short sentence. If a field genuinely has nothing to report, return an empty array — do NOT write apologies, disclaimers, or meta-commentary. Write all text in English.

${TONE_EN[tone]}`;
  }
  const fields = chosen.map((k) => `- ${FIELD_ZH[k]}`).join("\n");
  return `你是一個團隊 retro（回顧會議）的 AI 助理。你會收到一場 retro 的所有回答（已去識別化，只有文字）。請分析後回傳一個 JSON 物件，只包含這些欄位：

${fields}

原則：對事不對人、具體、可行動。忠實反映回答內容，不要杜撰沒有出現的事。每一條保持一句短句。若某欄位確實沒有內容，回傳空陣列即可，不要寫道歉、免責或說明性的句子。所有文字用繁體中文。

${TONE_ZH[tone]}`;
}

// Which report section each template question feeds. Lets us group answers
// deterministically (by question intent) instead of relying on the AI to guess.
const SECTION_OF: Record<string, "well" | "improve" | "actions"> = {
  // sailboat
  wind: "well",
  anchor: "improve",
  rocks: "improve",
  island: "actions",
  // garden
  blooming: "well",
  needs_water: "improve",
  weeds: "improve",
  seeds: "actions",
  // space mission
  liftoff: "well",
  gravity: "improve",
  alerts: "improve",
  next_coordinates: "actions",
};

export function buildContext(
  templateId: string,
  answers: { question_key: string; content: string }[],
  locale: Locale = "en",
): string {
  const template = getTemplate(templateId, locale);
  const questions = template?.questions ?? [];
  const buckets: Record<"well" | "improve" | "actions", string[]> = {
    well: [],
    improve: [],
    actions: [],
  };
  for (const q of questions) {
    if (q.type === "rating" || q.type === "role") continue;
    const bucket = SECTION_OF[q.key];
    if (!bucket) continue;
    for (const a of answers.filter((x) => x.question_key === q.key)) {
      const c = a.content.trim();
      if (c) buckets[bucket].push(`- ${c}  (${q.label})`);
    }
  }
  const en = locale === "en";
  const none = en ? "(no answers)" : "（沒有回答）";
  const section = (title: string, arr: string[]) =>
    `### ${title}\n${arr.length ? arr.join("\n") : none}\n`;
  return [
    section(
      en
        ? "WENT WELL — things the team is happy about"
        : "順利的部分——團隊覺得好的地方",
      buckets.well,
    ),
    section(
      en
        ? "PROBLEMS & WARNINGS — what slowed us down or to watch"
        : "問題與警訊——拖累進度或要注意的",
      buckets.improve,
    ),
    section(
      en
        ? "DIRECTION — where the team wants to head next"
        : "方向——團隊接下來想往哪走",
      buckets.actions,
    ),
  ].join("\n");
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

  let parsed: {
    summary?: unknown;
    well?: unknown;
    improve?: unknown;
    actions?: unknown;
  };
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error(
      locale === "en"
        ? "The AI returned malformed output — please try again."
        : "AI 回傳格式有誤，請再試一次。",
    );
  }
  // Keep exactly the requested fields, defaulting missing ones so every chosen
  // section renders (empty → empty state) rather than silently disappearing.
  const out: StructuredReport = {};
  if (chosen.includes("themes"))
    out.summary = typeof parsed.summary === "string" ? parsed.summary : "";
  if (chosen.includes("well"))
    out.well = Array.isArray(parsed.well) ? (parsed.well as string[]) : [];
  if (chosen.includes("improve"))
    out.improve = Array.isArray(parsed.improve)
      ? (parsed.improve as string[])
      : [];
  if (chosen.includes("actions"))
    out.actions = Array.isArray(parsed.actions)
      ? (parsed.actions as string[])
      : [];
  return JSON.stringify(out);
}
