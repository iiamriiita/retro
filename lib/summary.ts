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

export function summarySystem(
  locale: Locale,
  tone: ReportTone = "neutral",
  sections: ReportSection[] = ALL_SECTIONS,
): string {
  const chosen = sections.length > 0 ? sections : ALL_SECTIONS;
  const wantSummary = chosen.includes("themes");
  const wantPoints = chosen.includes("well") || chosen.includes("improve");
  const wantActions = chosen.includes("actions");

  if (locale === "en") {
    const fields: string[] = [];
    if (wantPoints)
      fields.push(
        '- points: an array that classifies EVERY answer, one by one. For each answer output an object { "text": a one-short-sentence version of what they said, "kind": "well" if it is positive / went well, or "improve" if it is a problem, frustration, or went badly }. Judge each answer on its OWN meaning, not on which question it sits under — a problem is "improve" even if written under a positive prompt, and a positive is "well" even under a problems prompt. If an answer only names a topic with no clear good/bad, use the bracketed leaning of its question. Skip answers that just say "none" / "n/a" / "nothing".',
      );
    if (wantActions)
      fields.push(
        '- actions: YOUR own concrete, specific suggested adjustments that address the "improve" problems (and any direction people mentioned) — propose them yourself even if no one spelled them out.',
      );
    if (wantSummary)
      fields.push(
        "- summary: ONE short sentence (25 words max) capturing the overall takeaway. End it with a period. Do NOT ramble or pad with generic business commentary.",
      );
    return `You are an AI assistant for a team retrospective. You'll receive all the answers from one retro (de-identified, text only). Return a JSON object with ONLY these fields:

${fields.join("\n")}

Go through the answers ONE BY ONE — do not skip any. Worked example: "efficiency is poor" → { "text": "Efficiency is poor", "kind": "improve" }; "too much joking around" → kind "improve"; "user testing went great" → kind "well". Keep the wording faithful to the answer (do not flip a negative into a positive).

Principles: about the work not the person, specific, actionable. Reflect the answers faithfully; don't invent points nobody mentioned. Keep each text to one short sentence. Write all text in English.

${TONE_EN[tone]}`;
  }

  const fields: string[] = [];
  if (wantPoints)
    fields.push(
      '- points：一個陣列，把「每一條」回答逐條分類。每條回答輸出一個物件 { "text": 用一句短句重述這條回答的內容, "kind": 若是正向、順利就填 "well"，若是問題、困擾、不順就填 "improve" }。請依「這條回答本身的意思」判斷，而不是依它寫在哪一題——問題就算寫在正向題也算 "improve"，正向就算寫在問題題也算 "well"。若某條只點出主題、沒說好壞，就依該題括號標示的傾向判斷。像「沒有」「無」「n/a」這種就跳過不收。',
    );
  if (wantActions)
    fields.push(
      '- actions：由你針對上面那些 "improve" 問題（以及大家提到的方向）提出的具體調整建議——就算沒人明講，也請主動給出可行、具體的下一步。',
    );
  if (wantSummary)
    fields.push(
      "- summary：用「一句話」（最多約 45 字）總結這場 retro 的整體重點，句末加句號，不要長篇大論或加空泛的場面話。",
    );
  return `你是一個團隊 retro（回顧會議）的 AI 助理。你會收到一場 retro 的所有回答（已去識別化，只有文字）。請回傳一個 JSON 物件，只包含這些欄位：

${fields.join("\n")}

請逐條把回答看過，不可跳過任何一條。範例：「效率差」→ { "text": "效率差", "kind": "improve" }；「大家太愛開玩笑」→ kind "improve"；「用戶測試很好」→ kind "well"。重述時要忠於原意（不可以把負向講成正向）。

原則：對事不對人、具體、可行動。忠實反映回答內容，不要杜撰沒人提到的點。每一條保持一句短句。所有文字用繁體中文。

${TONE_ZH[tone]}`;
}

// Default leaning of each template question. This is only a HINT / tiebreaker:
// the AI sorts each answer by what it actually says, and falls back to this
// leaning when an answer just names a topic with no clear good/bad.
const QUESTION_LEANING: Record<string, "positive" | "problem" | "direction"> = {
  // sailboat
  wind: "positive",
  anchor: "problem",
  rocks: "problem",
  island: "direction",
  // garden
  blooming: "positive",
  needs_water: "problem",
  weeds: "problem",
  seeds: "direction",
  // space mission
  liftoff: "positive",
  gravity: "problem",
  alerts: "problem",
  next_coordinates: "direction",
};

export function buildContext(
  templateId: string,
  answers: { question_key: string; content: string }[],
  locale: Locale = "en",
): string {
  const template = getTemplate(templateId, locale);
  const questions = template?.questions ?? [];
  const en = locale === "en";
  const leanLabel = (l: "positive" | "problem" | "direction" | undefined) => {
    if (!l) return "";
    if (en)
      return l === "positive"
        ? " [this prompt leans positive]"
        : l === "problem"
          ? " [this prompt leans toward problems]"
          : " [this prompt leans toward future direction]";
    return l === "positive"
      ? "（此題偏正向）"
      : l === "problem"
        ? "（此題偏問題）"
        : "（此題偏未來方向）";
  };

  const blocks: string[] = [];
  for (const q of questions) {
    if (q.type === "rating" || q.type === "role") continue;
    const items = answers
      .filter((x) => x.question_key === q.key)
      .map((a) => a.content.trim())
      .filter(Boolean);
    if (!items.length) continue;
    blocks.push(
      `### ${q.label}${leanLabel(QUESTION_LEANING[q.key])}\n` +
        items.map((c) => `- ${c}`).join("\n"),
    );
  }
  if (!blocks.length) return en ? "(no answers)" : "（沒有任何回答）";
  return blocks.join("\n\n");
}

// Guard against the model degenerating into an endless run-on summary: keep the
// first sentence, and hard-cap the length so a runaway can never reach the UI.
function clampSummary(raw: string): string {
  let out = raw.trim();
  const stop = out.search(/[.!?。！？]/);
  if (stop >= 0 && stop <= 280) return out.slice(0, stop + 1).trim();
  if (out.length > 280) {
    out = out.slice(0, 280);
    const lastSpace = out.lastIndexOf(" ");
    if (lastSpace > 200) out = out.slice(0, lastSpace);
    out = out.replace(/[\s,;:，、；：]+$/, "") + "…";
  }
  return out.trim();
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

  // Build a response schema with only the requested fields. well/improve are
  // NOT asked for directly (the model tends to leave one empty) — instead we ask
  // it to label every answer and we split them into the two boxes ourselves.
  const wantPoints = chosen.includes("well") || chosen.includes("improve");
  const props: Record<string, unknown> = {};
  const order: string[] = [];
  // Generate the classification FIRST, then actions, then the summary last. The
  // summary can occasionally run away and eat the token budget; keeping it last
  // means it can never starve the points that feed the green/red boxes.
  if (wantPoints) {
    props.points = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          text: { type: "STRING" },
          kind: { type: "STRING", enum: ["well", "improve"] },
        },
        required: ["text", "kind"],
      },
    };
    order.push("points");
  }
  if (chosen.includes("actions")) {
    props.actions = { type: "ARRAY", items: { type: "STRING" } };
    order.push("actions");
  }
  if (chosen.includes("themes")) {
    props.summary = { type: "STRING" };
    order.push("summary");
  }
  const responseSchema = {
    type: "OBJECT",
    properties: props,
    propertyOrdering: order,
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: intro }] },
    contents: [{ role: "user", parts: [{ text: ask }] }],
    generationConfig: {
      temperature: 0.55,
      maxOutputTokens: 2600,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  // The model can be briefly overloaded (503) — retry a couple of times.
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      signal: AbortSignal.timeout(30_000),
    });
    if (res.status !== 503 && res.status !== 500) break;
    if (attempt < 2)
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
  }

  if (!res || !res.ok) {
    const status = res?.status ?? 0;
    if (status === 429)
      throw new Error(
        locale === "en"
          ? "The AI is over its usage quota right now. Please try again in a little while."
          : "AI 目前已超過用量額度，請稍後再試（Gemini 免費額度有限）。",
      );
    if (status === 503 || status === 500)
      throw new Error(
        locale === "en"
          ? "The AI is very busy right now. Please try again in a moment."
          : "AI 目前流量很大、暫時忙碌，請稍等一下再試一次。",
      );
    const detail = res ? await res.text().catch(() => "") : "";
    throw new Error(
      (locale === "en" ? "AI service error" : "AI 服務錯誤") +
        `（${status}）：${detail.slice(0, 300)}`,
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
    points?: unknown;
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
    out.summary =
      typeof parsed.summary === "string" ? clampSummary(parsed.summary) : "";
  if (wantPoints) {
    // Split the labelled answers into the green (well) and red (improve) boxes.
    const points = Array.isArray(parsed.points) ? parsed.points : [];
    const well: string[] = [];
    const improve: string[] = [];
    for (const p of points) {
      if (!p || typeof p !== "object") continue;
      const text =
        typeof (p as { text?: unknown }).text === "string"
          ? (p as { text: string }).text.trim()
          : "";
      if (!text) continue;
      const kind = String((p as { kind?: unknown }).kind ?? "").toLowerCase();
      const isImprove =
        kind.includes("improve") ||
        kind.includes("bad") ||
        kind.includes("problem");
      (isImprove ? improve : well).push(text);
    }
    if (chosen.includes("well")) out.well = well;
    if (chosen.includes("improve")) out.improve = improve;
  }
  if (chosen.includes("actions"))
    out.actions = Array.isArray(parsed.actions)
      ? (parsed.actions as string[])
      : [];
  return JSON.stringify(out);
}
