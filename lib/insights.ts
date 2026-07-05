import { getTemplate } from "./templates";
import type { Locale } from "./i18n/messages";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/* ============================================================
   Real, computed-from-DB stats (no AI). Always available.
   ============================================================ */

export interface RetroRow {
  id: string;
  template_id: string;
  status: "open" | "closed";
  deadline: string;
  created_at: string;
}

export interface TimelinePoint {
  id: string;
  dateLabel: string;
  responses: number;
  submitted: number; // people who submitted (for participation height)
  rating: number | null; // avg 1–5 mood for this retro (for bar colour)
}

export interface TeamStats {
  retroCount: number;
  closedCount: number;
  totalResponses: number;
  totalComments: number;
  avgResponses: number;
  responsesDelta: number | null; // latest closed retro vs the one before
  commentsDelta: number | null;
  timeline: TimelinePoint[]; // chronological, up to last 8
  teamSize: number | null;
  participationAvg: number | null; // 0–100, only when teamSize is set
  participationDelta: number | null;
  discussionRate: number | null; // % of finished retros that had discussion
  // Team sentiment from 1–5 mood ratings (computed, no AI).
  avgRating: number | null; // overall average across rated finished retros
  momentum: "up" | "down" | "flat";
  streak: number; // consecutive steps in the momentum direction at the tail
  hasTrend: boolean; // ≥2 rated finished retros to compare
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/** Tally real stats from the owner's retros + per-session answer/comment counts. */
export function computeTeamStats(
  retros: RetroRow[],
  responsesBySession: Map<string, number>,
  commentsBySession: Map<string, number>,
  submittedBySession: Map<string, number> = new Map(),
  teamSize: number | null = null,
  ratingBySession: Map<string, number> = new Map(),
): TeamStats {
  const byDate = [...retros].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const isClosed = (r: RetroRow) =>
    r.status === "closed" || new Date(r.deadline).getTime() <= Date.now();

  const totalResponses = retros.reduce(
    (n, r) => n + (responsesBySession.get(r.id) ?? 0),
    0,
  );
  const totalComments = retros.reduce(
    (n, r) => n + (commentsBySession.get(r.id) ?? 0),
    0,
  );
  const closed = byDate.filter(isClosed);
  const closedCount = closed.length;

  // Deltas: most recent closed retro vs the previous closed one.
  let responsesDelta: number | null = null;
  let commentsDelta: number | null = null;
  if (closed.length >= 2) {
    const last = closed[closed.length - 1];
    const prev = closed[closed.length - 2];
    responsesDelta =
      (responsesBySession.get(last.id) ?? 0) -
      (responsesBySession.get(prev.id) ?? 0);
    commentsDelta =
      (commentsBySession.get(last.id) ?? 0) -
      (commentsBySession.get(prev.id) ?? 0);
  }

  const timeline: TimelinePoint[] = byDate.slice(-8).map((r) => ({
    id: r.id,
    dateLabel: fmtDate(r.created_at),
    responses: responsesBySession.get(r.id) ?? 0,
    submitted: submittedBySession.get(r.id) ?? 0,
    rating: ratingBySession.has(r.id) ? ratingBySession.get(r.id)! : null,
  }));

  // Participation = submissions / expected team size, per closed retro, averaged.
  let participationAvg: number | null = null;
  let participationDelta: number | null = null;
  if (teamSize && teamSize > 0 && closed.length > 0) {
    const pct = (r: RetroRow) =>
      Math.min(100, Math.round(((submittedBySession.get(r.id) ?? 0) / teamSize) * 100));
    participationAvg = Math.round(
      closed.reduce((n, r) => n + pct(r), 0) / closed.length,
    );
    if (closed.length >= 2) {
      participationDelta =
        pct(closed[closed.length - 1]) - pct(closed[closed.length - 2]);
    }
  }

  // Team sentiment is driven by the 1–5 mood ratings. Momentum = trend of the
  // per-retro average rating across finished retros that have ratings.
  const ratedClosed = closed.filter((r) => ratingBySession.has(r.id));
  const ratingSeries = ratedClosed.map((r) => ratingBySession.get(r.id)!);
  const avgRating =
    ratingSeries.length > 0
      ? ratingSeries.reduce((n, v) => n + v, 0) / ratingSeries.length
      : null;
  const hasTrend = ratingSeries.length >= 2;
  let momentum: "up" | "down" | "flat" = "flat";
  let streak = 0; // consecutive steps in the momentum direction, from the tail
  if (hasTrend) {
    const last = ratingSeries[ratingSeries.length - 1];
    const prev = ratingSeries[ratingSeries.length - 2];
    momentum = last > prev ? "up" : last < prev ? "down" : "flat";
    if (momentum !== "flat") {
      for (let i = ratingSeries.length - 1; i > 0; i--) {
        const up = ratingSeries[i] > ratingSeries[i - 1];
        const down = ratingSeries[i] < ratingSeries[i - 1];
        if ((momentum === "up" && up) || (momentum === "down" && down)) streak++;
        else break;
      }
    }
  }

  // Discussion activity = share of finished retros that sparked any comment.
  const discussionRate =
    closedCount > 0
      ? Math.round(
          (closed.filter((r) => (commentsBySession.get(r.id) ?? 0) > 0).length /
            closedCount) *
            100,
        )
      : null;

  return {
    retroCount: retros.length,
    closedCount,
    totalResponses,
    totalComments,
    avgResponses: retros.length
      ? Math.round((totalResponses / retros.length) * 10) / 10
      : 0,
    responsesDelta,
    commentsDelta,
    timeline,
    teamSize,
    participationAvg,
    participationDelta,
    discussionRate,
    avgRating,
    momentum,
    streak,
    hasTrend,
  };
}

/* ============================================================
   AI insights (on demand, cached per owner).
   ============================================================ */

export interface AiInsights {
  // A short 3–4 line read on the team. Everything else on the panel (sentiment,
  // chart) is computed from ratings, so the AI only writes this one brief.
  pulse: string;
}

export interface RetroForAI {
  dateLabel: string;
  templateId: string;
  answers: { question_key: string; content: string }[];
}

const INSIGHTS_SYSTEM_ZH = `你是一個團隊 retro（回顧會議）的資深教練。你會收到同一個團隊「多場」retro 的回答（依時間排序，已去識別化）。

請跨場快速看團隊的走向，然後用「3–4 行、繁體中文」寫一段簡短的團隊近況：點出走向、持續的優點、以及還沒解決的痛點。白話、具體，不要空泛的場面話。

只輸出這段文字本身，不要 JSON、不要標題、不要條列符號、不要 markdown。對事不對人、忠實反映內容、不要杜撰沒出現的事。`;

const INSIGHTS_SYSTEM_EN = `You are a senior coach for a team's retrospectives. You'll receive answers from MULTIPLE retros of the same team (in chronological order, de-identified).

Skim the team's trajectory across retros, then write a short 3–4 line read on the team in English: the trajectory, lasting strengths, and unresolved pain points. Plain and specific, no generic filler.

Output only that text — no JSON, no heading, no bullet points, no markdown. About the work not the people; reflect the content faithfully; don't invent things.`;

function buildAiContext(retros: RetroForAI[], locale: Locale): string {
  const nth = (i: number, d: string) =>
    locale === "en" ? `## Retro ${i + 1} (${d})` : `## 第 ${i + 1} 場（${d}）`;
  const blocks: string[] = [];
  retros.forEach((r, i) => {
    const template = getTemplate(r.templateId, locale);
    const questions = template?.questions ?? [];
    const lines: string[] = [nth(i, r.dateLabel)];
    for (const q of questions) {
      if (q.type === "rating") continue;
      const group = r.answers.filter((a) => a.question_key === q.key);
      if (group.length === 0) continue;
      lines.push(`### ${q.label}`);
      for (const a of group) lines.push(`- ${a.content}`);
    }
    blocks.push(lines.join("\n"));
  });
  return blocks.join("\n\n");
}

export async function geminiInsights(
  retros: RetroForAI[],
  locale: Locale = "en",
): Promise<AiInsights> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    throw new Error(
      locale === "en"
        ? "GEMINI_API_KEY is not set; cannot generate AI insights."
        : "尚未設定 GEMINI_API_KEY，無法產生 AI 洞察。",
    );

  const context = buildAiContext(retros, locale);
  const system = locale === "en" ? INSIGHTS_SYSTEM_EN : INSIGHTS_SYSTEM_ZH;
  const intro =
    locale === "en"
      ? `${system}\n\nHere are the team's retros in chronological order:\n\n${context}`
      : `${system}\n\n以下是這個團隊依時間排序的多場 retro 回答：\n\n${context}`;
  const ask =
    locale === "en"
      ? "Write the 3–4 line summary now."
      : "請現在寫出那段 3–4 行的近況。";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: intro }] },
    contents: [{ role: "user", parts: [{ text: ask }] }],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 700,
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
  const rawText: string =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim() ?? "";
  if (!rawText)
    throw new Error(
      locale === "en"
        ? "The AI returned no content — please try again."
        : "AI 沒有回覆內容，請再試一次。",
    );

  // Plain text — just tidy it. Strip any stray code fences or an accidental
  // { "pulse": "..." } wrapper the model might add, then hand it back as-is.
  let pulse = rawText;
  if (pulse.startsWith("```")) {
    pulse = pulse
      .replace(/^```(?:json|text)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
  }
  const wrapped = pulse.match(/^\{[\s\S]*"pulse"\s*:\s*"([\s\S]*?)"[\s\S]*\}$/);
  if (wrapped) pulse = wrapped[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');

  return { pulse: pulse.trim() };
}
