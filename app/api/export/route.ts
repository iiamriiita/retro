import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getLocale } from "@/lib/i18n/server";
import { getTemplate } from "@/lib/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SessionRow {
  id: string;
  name: string;
  template_id: string;
  anonymity: string;
  status: string;
  deadline: string | null;
  created_at: string;
  ai_report: string | null;
  ai_report_at: string | null;
}

interface AnswerRow {
  session_id: string;
  question_key: string;
  content: string;
  participant_id: string | null;
  created_at: string;
}

interface ParticipantRow {
  id: string;
  display_name: string | null;
}

function csvCell(v: string): string {
  return `"${(v ?? "").replace(/"/g, '""')}"`;
}

function day(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

// Owner-only: download everything the team has collected as CSV or Markdown.
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const format =
    new URL(req.url).searchParams.get("format") === "md" ? "md" : "csv";
  const locale = await getLocale();
  const zh = locale === "zh";

  const supabase = createServiceClient();
  const { data: sessions, error } = await supabase
    .from("retro_sessions")
    .select(
      "id, name, template_id, anonymity, status, deadline, created_at, ai_report, ai_report_at",
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });
  if (error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 });

  const list = (sessions ?? []) as SessionRow[];
  const ids = list.map((s) => s.id);

  let answers: AnswerRow[] = [];
  const nameOf = new Map<string, string>();
  if (ids.length > 0) {
    const { data: aRows } = await supabase
      .from("retro_answers")
      .select("session_id, question_key, content, participant_id, created_at")
      .in("session_id", ids)
      .order("created_at", { ascending: true });
    answers = (aRows ?? []) as AnswerRow[];

    const { data: pRows } = await supabase
      .from("retro_participants")
      .select("id, display_name")
      .in("session_id", ids);
    for (const p of (pRows ?? []) as ParticipantRow[]) {
      if (p.display_name) nameOf.set(p.id, p.display_name);
    }
  }

  const anonLabel = zh ? "匿名" : "Anonymous";
  function respondent(s: SessionRow, a: AnswerRow): string {
    if (s.anonymity === "anonymous") return anonLabel;
    return (a.participant_id && nameOf.get(a.participant_id)) || anonLabel;
  }
  function questionLabel(s: SessionRow, key: string): string {
    const tpl = getTemplate(s.template_id, locale);
    return tpl?.questions.find((q) => q.key === key)?.label ?? key;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  let body: string;
  let contentType: string;
  let filename: string;

  if (format === "csv") {
    const header = zh
      ? ["Retro", "建立日期", "狀態", "問題", "填答者", "回覆", "回覆時間"]
      : ["Retro", "Created", "Status", "Question", "Respondent", "Answer", "Answered at"];
    const lines = [header.map(csvCell).join(",")];
    for (const s of list) {
      const rows = answers.filter((a) => a.session_id === s.id);
      for (const a of rows) {
        lines.push(
          [
            s.name,
            day(s.created_at),
            s.status,
            questionLabel(s, a.question_key),
            respondent(s, a),
            a.content,
            day(a.created_at),
          ]
            .map(csvCell)
            .join(","),
        );
      }
    }
    // BOM so Excel opens UTF-8 (Chinese answers) correctly.
    body = "﻿" + lines.join("\r\n");
    contentType = "text/csv; charset=utf-8";
    filename = `team-retro-export-${stamp}.csv`;
  } else {
    const parts: string[] = [];
    for (const s of list) {
      const rows = answers.filter((a) => a.session_id === s.id);
      const meta = zh
        ? `建立：${day(s.created_at)} · 狀態：${s.status} · ${s.anonymity === "anonymous" ? "匿名" : "具名"}`
        : `Created ${day(s.created_at)} · status ${s.status} · ${s.anonymity}`;
      const chunk: string[] = [`# ${s.name}`, "", meta];
      if (s.ai_report) {
        chunk.push("", zh ? "## AI 報告" : "## AI report", "", s.ai_report);
      }
      if (rows.length > 0) {
        chunk.push("", zh ? "## 回覆" : "## Answers");
        const keys = Array.from(new Set(rows.map((a) => a.question_key)));
        for (const key of keys) {
          chunk.push("", `### ${questionLabel(s, key)}`, "");
          for (const a of rows.filter((r) => r.question_key === key)) {
            chunk.push(`- **${respondent(s, a)}**: ${a.content}`);
          }
        }
      }
      parts.push(chunk.join("\n"));
    }
    body = parts.join("\n\n---\n\n") + "\n";
    contentType = "text/markdown; charset=utf-8";
    filename = `team-retro-export-${stamp}.md`;
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
