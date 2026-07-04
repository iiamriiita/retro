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
  };
}

/* ============================================================
   AI insights (on demand, cached per owner).
   ============================================================ */

export interface AiInsights {
  sentiment: { label: string; score: number; note: string };
  pulse: string;
  themes: { label: string; count: number; direction: "up" | "warning" | "down" }[];
  timeline: { label: string; score: number }[];
}

export interface RetroForAI {
  dateLabel: string;
  templateId: string;
  answers: { question_key: string; content: string }[];
}

const INSIGHTS_SYSTEM_ZH = `你是一個團隊 retro（回顧會議）的資深教練。你會收到同一個團隊「多場」retro 的回答（依時間排序，已去識別化）。

請跨場分析團隊的走向，並「只」輸出 JSON（繁體中文內容），欄位如下：
- sentiment.label：整體氛圍，用「正面 / 中性 / 需要關注」其中一個。
- sentiment.score：0–100 的整體健康分數。
- sentiment.note：一句話趨勢註解，例如「連續 3 場改善中」。
- pulse：2–4 句話的團隊近況敘述，點出走向、持續的優點、以及尚未解決的痛點。
- themes：跨場重複出現的主題陣列，每個含 label（主題名，2–6 字）、count（大約出現次數）、direction（up=正在變好、warning=反覆出現的痛點、down=正在惡化）。最多 6 個，依重要性排序。
- timeline：每一場的氛圍分數，label 用該場日期、score 0–100，順序與輸入相同。

原則：對事不對人、忠實反映內容、不要杜撰沒出現的事。只輸出 JSON，不要多餘文字。`;

const INSIGHTS_SYSTEM_EN = `You are a senior coach for a team's retrospectives. You'll receive answers from MULTIPLE retros of the same team (in chronological order, de-identified).

Analyze the team's trajectory across retros and output ONLY JSON (content in English), with these fields:
- sentiment.label: overall mood, one of "Positive / Neutral / Needs attention".
- sentiment.score: an overall health score, 0–100.
- sentiment.note: a one-line trend note, e.g. "Improving 3 retros in a row".
- pulse: 2–4 sentences on where the team is — the trajectory, lasting strengths, and unresolved pain points.
- themes: recurring themes across retros; each has label (2–4 words), count (approx times it appeared), direction (up = improving, warning = recurring pain point, down = getting worse). Max 6, ordered by importance.
- timeline: a mood score per retro; label is that retro's date, score 0–100, in the same order as the input.

Principles: about the work not the people, reflect the content faithfully, don't invent things. Output JSON only, no extra text.`;

function buildAiContext(retros: RetroForAI[], locale: Locale): string {
  const nth = (i: number, d: string) =>
    locale === "en" ? `## Retro ${i + 1} (${d})` : `## 第 ${i + 1} 場（${d}）`;
  const blocks: string[] = [];
  retros.forEach((r, i) => {
    const template = getTemplate(r.templateId, locale);
    const questions = template?.questions ?? [];
    const lines: string[] = [nth(i, r.dateLabel)];
    for (const q of questions) {
      const group = r.answers.filter((a) => a.question_key === q.key);
      if (group.length === 0) continue;
      lines.push(`### ${q.label}`);
      for (const a of group) lines.push(`- ${a.content}`);
    }
    blocks.push(lines.join("\n"));
  });
  return blocks.join("\n\n");
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    sentiment: {
      type: "object",
      properties: {
        label: { type: "string" },
        score: { type: "number" },
        note: { type: "string" },
      },
      required: ["label", "score", "note"],
    },
    pulse: { type: "string" },
    themes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          count: { type: "number" },
          direction: { type: "string", enum: ["up", "warning", "down"] },
        },
        required: ["label", "count", "direction"],
      },
    },
    timeline: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          score: { type: "number" },
        },
        required: ["label", "score"],
      },
    },
  },
  required: ["sentiment", "pulse", "themes", "timeline"],
};

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
      ? "Analyze across retros and output JSON."
      : "請跨場分析並輸出 JSON。";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: intro }] },
      contents: [{ role: "user", parts: [{ text: ask }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1200,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
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
  const raw: string =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim() ?? "";
  if (!raw)
    throw new Error(
      locale === "en"
        ? "The AI returned no content — please try again."
        : "AI 沒有回覆內容，請再試一次。",
    );

  let parsed: AiInsights;
  try {
    parsed = JSON.parse(raw) as AiInsights;
  } catch {
    throw new Error(
      locale === "en"
        ? "The AI returned malformed output — please try again."
        : "AI 回傳格式錯誤，請再試一次。",
    );
  }
  return parsed;
}
