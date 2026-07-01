"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { PublicAnswer, PublicComment, Question } from "@/lib/types";

interface FloatingBtn {
  x: number;
  y: number;
  answerId: string;
  start: number;
  end: number;
  quote: string;
}

interface Composer {
  answerId: string;
  start: number;
  end: number;
  quote: string;
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
}

// Render an answer's text with <mark> over any character covered by a comment.
function renderHighlighted(content: string, ranges: PublicComment[]) {
  const clamp = (n: number) => Math.max(0, Math.min(content.length, n));
  const spans = ranges
    .map((r) => ({ start: clamp(r.quote_start), end: clamp(r.quote_end) }))
    .filter((r) => r.end > r.start);
  if (spans.length === 0) return content;

  const points = new Set<number>([0, content.length]);
  spans.forEach((r) => {
    points.add(r.start);
    points.add(r.end);
  });
  const sorted = [...points].sort((a, b) => a - b);

  const out: React.ReactNode[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const s = sorted[i];
    const e = sorted[i + 1];
    if (e <= s) continue;
    const marked = spans.some((r) => r.start <= s && r.end >= e);
    const chunk = content.slice(s, e);
    out.push(
      marked ? (
        <mark key={i} className="rounded bg-amber-100 px-0.5">
          {chunk}
        </mark>
      ) : (
        <span key={i}>{chunk}</span>
      ),
    );
  }
  return out;
}

export default function ResultsClient({
  sessionId,
  anonymous,
  questions,
  answers,
  initialComments,
}: {
  sessionId: string;
  anonymous: boolean;
  questions: Question[];
  answers: PublicAnswer[];
  initialComments: PublicComment[];
}) {
  const [comments, setComments] = useState<PublicComment[]>(initialComments);
  const [floating, setFloating] = useState<FloatingBtn | null>(null);
  const [composer, setComposer] = useState<Composer | null>(null);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const commentsByAnswer = useMemo(() => {
    const map = new Map<string, PublicComment[]>();
    for (const c of comments) {
      const arr = map.get(c.answer_id) ?? [];
      arr.push(c);
      map.set(c.answer_id, arr);
    }
    return map;
  }, [comments]);

  const sortedComments = useMemo(
    () =>
      [...comments].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [comments],
  );

  // Realtime: new comment threads appear live for everyone viewing.
  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`retro_comments:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "retro_comments",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const c = payload.new as PublicComment;
          setComments((prev) =>
            prev.some((x) => x.id === c.id) ? prev : [...prev, c],
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // On mouse-up, if the user selected text inside one answer, offer a Comment
  // button at the pointer.
  function onMouseUp(e: React.MouseEvent) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setFloating(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const answerEl =
      range.startContainer.parentElement?.closest<HTMLElement>(
        "[data-answer-id]",
      );
    if (
      !answerEl ||
      !answerEl.contains(range.endContainer) ||
      !answerEl.contains(range.startContainer)
    ) {
      setFloating(null);
      return;
    }
    const pre = range.cloneRange();
    pre.selectNodeContents(answerEl);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const quote = range.toString();
    if (quote.trim().length === 0) {
      setFloating(null);
      return;
    }
    setFloating({
      x: e.clientX,
      y: e.clientY,
      answerId: answerEl.dataset.answerId!,
      start,
      end: start + quote.length,
      quote,
    });
  }

  function openComposer() {
    if (!floating) return;
    setComposer({
      answerId: floating.answerId,
      start: floating.start,
      end: floating.end,
      quote: floating.quote,
    });
    setBody("");
    setError(null);
    setFloating(null);
    window.getSelection()?.removeAllRanges();
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!composer || !body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          answer_id: composer.answerId,
          quote: composer.quote,
          quote_start: composer.start,
          quote_end: composer.end,
          body: body.trim(),
          author_name: anonymous ? undefined : name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "留言失敗");
      const c = data.comment as PublicComment;
      setComments((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]));
      setComposer(null);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "留言失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* Left: answers with highlights */}
      <div ref={contentRef} onMouseUp={onMouseUp} className="space-y-8">
        {questions.map((q) => {
          const group = answers.filter((a) => a.question_key === q.key);
          return (
            <section key={q.key}>
              <h2 className="text-base font-semibold">{q.label}</h2>
              <p className="mb-3 text-xs text-muted">{group.length} 則回答</p>
              {group.length === 0 ? (
                <p className="text-sm text-muted">還沒有人回答這題。</p>
              ) : (
                <ul className="space-y-3">
                  {group.map((a) => (
                    <li key={a.id} className="card">
                      <p
                        data-answer-id={a.id}
                        className="whitespace-pre-wrap text-sm text-ink"
                      >
                        {renderHighlighted(
                          a.content,
                          commentsByAnswer.get(a.id) ?? [],
                        )}
                      </p>
                      {!anonymous && a.author_name && (
                        <p className="mt-2 text-xs text-muted">
                          — {a.author_name}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
        <p className="text-xs text-muted">
          💡 用滑鼠選取任一段回答文字，就能對它留言。
        </p>
      </div>

      {/* Right: comment sidebar */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <h3 className="mb-3 text-sm font-semibold">留言</h3>

        {composer && (
          <form onSubmit={submitComment} className="card mb-4 space-y-2">
            <p className="border-l-2 border-amber-300 pl-2 text-xs italic text-muted">
              「{composer.quote.slice(0, 120)}」
            </p>
            <textarea
              autoFocus
              rows={3}
              className="textarea"
              placeholder="寫下你的留言…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            {!anonymous && (
              <input
                className="textarea !py-1.5"
                placeholder="你的名字（可留空）"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                className="btn-primary !py-1.5 text-xs"
                disabled={submitting || !body.trim()}
              >
                {submitting ? "送出中…" : "送出留言"}
              </button>
              <button
                type="button"
                className="btn-ghost !py-1.5 text-xs"
                onClick={() => setComposer(null)}
              >
                取消
              </button>
            </div>
          </form>
        )}

        {sortedComments.length === 0 && !composer && (
          <p className="text-sm text-muted">
            還沒有留言。選取一段回答文字來新增第一則。
          </p>
        )}

        <ul className="space-y-3">
          {sortedComments.map((c) => (
            <li key={c.id} className="card">
              <p className="border-l-2 border-amber-300 pl-2 text-xs italic text-muted">
                「{c.quote.slice(0, 120)}」
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{c.body}</p>
              <p className="mt-1 text-[11px] text-muted">
                {(anonymous ? null : c.author_name) || "匿名"} · {fmtTime(c.created_at)}
              </p>
            </li>
          ))}
        </ul>
      </aside>

      {/* Floating "Comment" button at the selection */}
      {floating && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openComposer}
          style={{ position: "fixed", left: floating.x, top: floating.y + 8, zIndex: 50 }}
          className="rounded-md bg-ink px-2.5 py-1 text-xs font-medium text-white shadow-lg"
        >
          💬 留言
        </button>
      )}
    </div>
  );
}
