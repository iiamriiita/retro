"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import Icon from "@/components/Icon";
import type { PublicAnswer, PublicComment, Question } from "@/lib/types";

interface Coords {
  x: number;
  y: number;
}
interface Pending {
  answerId: string;
  start: number;
  end: number;
  quote: string;
  x: number;
  y: number;
}
interface FloatingBtn extends Pending {}

type PendingAction =
  | { kind: "comment"; p: Pending }
  | { kind: "reply"; parentId: string }
  | null;

interface Identity {
  name: string | null;
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
}

/** Character offset of (node, offset) within root, skipping any [data-pin] subtree
 *  so inline comment pins don't corrupt selection offsets. */
function textOffset(root: HTMLElement, node: Node, offset: number): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      return (n.parentElement as HTMLElement | null)?.closest("[data-pin]")
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });
  let count = 0;
  let cur: Node | null;
  while ((cur = walker.nextNode())) {
    if (cur === node) return count + offset;
    count += cur.textContent?.length ?? 0;
  }
  return count;
}

export default function ResultsClient({
  sessionId,
  anonymous,
  discussionEnabled,
  questions,
  answers,
  initialComments,
  rosterNames,
}: {
  sessionId: string;
  anonymous: boolean;
  discussionEnabled: boolean;
  questions: Question[];
  answers: PublicAnswer[];
  initialComments: PublicComment[];
  rosterNames: string[];
}) {
  const [comments, setComments] = useState<PublicComment[]>(initialComments);
  const [floating, setFloating] = useState<FloatingBtn | null>(null);

  // Popovers (only one open at a time).
  const [composer, setComposer] = useState<Pending | null>(null);
  const [openThread, setOpenThread] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  const [body, setBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [identityOpen, setIdentityOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [customName, setCustomName] = useState("");

  const idKey = `retro_commenter_${sessionId}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(idKey);
    if (raw) {
      try {
        setIdentity(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, [idKey]);

  const topLevel = useMemo(
    () =>
      comments
        .filter((c) => !c.parent_id)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
    [comments],
  );
  const repliesByParent = useMemo(() => {
    const map = new Map<string, PublicComment[]>();
    for (const c of comments) {
      if (!c.parent_id) continue;
      const arr = map.get(c.parent_id) ?? [];
      arr.push(c);
      map.set(c.parent_id, arr);
    }
    for (const arr of map.values())
      arr.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    return map;
  }, [comments]);

  const anchorsByAnswer = useMemo(() => {
    const map = new Map<string, PublicComment[]>();
    for (const c of topLevel) {
      const arr = map.get(c.answer_id) ?? [];
      arr.push(c);
      map.set(c.answer_id, arr);
    }
    return map;
  }, [topLevel]);

  // Realtime.
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

  function closePopovers() {
    setComposer(null);
    setOpenThread(null);
    setError(null);
  }

  function saveIdentity(name: string | null) {
    const id = { name };
    setIdentity(id);
    if (typeof window !== "undefined")
      localStorage.setItem(idKey, JSON.stringify(id));
    setIdentityOpen(false);
    const action = pendingAction;
    setPendingAction(null);
    if (action?.kind === "comment") {
      setOpenThread(null);
      setComposer(action.p);
      setBody("");
    } else if (action?.kind === "reply") {
      setReplyBody("");
    }
  }

  function requireIdentity(action: PendingAction, run: () => void) {
    if (identity) {
      run();
    } else {
      setPendingAction(action);
      setIdentityOpen(true);
    }
  }

  function onMouseUp(e: React.MouseEvent) {
    if (!discussionEnabled) return;
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
    const start = textOffset(answerEl, range.startContainer, range.startOffset);
    const end = textOffset(answerEl, range.endContainer, range.endOffset);
    const answerId = answerEl.dataset.answerId!;
    const ans = answers.find((a) => a.id === answerId);
    const quote = ans ? ans.content.slice(start, end) : range.toString();
    if (end <= start || quote.trim().length === 0) {
      setFloating(null);
      return;
    }
    setFloating({ answerId, start, end, quote, x: e.clientX, y: e.clientY });
  }

  function startComment() {
    if (!floating) return;
    const p: Pending = { ...floating };
    setFloating(null);
    window.getSelection()?.removeAllRanges();
    requireIdentity({ kind: "comment", p }, () => {
      setOpenThread(null);
      setComposer(p);
      setBody("");
    });
  }

  async function postComment(payload: Record<string, unknown>) {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "留言失敗");
    const c = data.comment as PublicComment;
    setComments((prev) =>
      prev.some((x) => x.id === c.id) ? prev : [...prev, c],
    );
    return c;
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!composer || !body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const c = await postComment({
        session_id: sessionId,
        answer_id: composer.answerId,
        quote: composer.quote,
        quote_start: composer.start,
        quote_end: composer.end,
        body: body.trim(),
        author_name: identity?.name ?? undefined,
      });
      setComposer(null);
      setBody("");
      // Open the freshly-created thread pinned near where it was made.
      setOpenThread({ id: c.id, x: composer.x, y: composer.y });
    } catch (err) {
      setError(err instanceof Error ? err.message : "留言失敗");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReply(parentId: string) {
    if (!replyBody.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await postComment({
        session_id: sessionId,
        parent_id: parentId,
        body: replyBody.trim(),
        author_name: identity?.name ?? undefined,
      });
      setReplyBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "回覆失敗");
    } finally {
      setSubmitting(false);
    }
  }

  function openThreadAt(id: string, x: number, y: number) {
    setComposer(null);
    setFloating(null);
    setError(null);
    setReplyBody("");
    setOpenThread({ id, x, y });
  }

  /** Render answer content with gold highlights + an inline comment pin
   *  immediately after each anchored range (Figma-style). */
  function renderAnnotated(content: string, threads: PublicComment[]) {
    const clamp = (n: number) => Math.max(0, Math.min(content.length, n));
    const spans = threads
      .filter((c) => c.quote_start != null && c.quote_end != null)
      .map((c) => ({ c, start: clamp(c.quote_start!), end: clamp(c.quote_end!) }))
      .filter((s) => s.end > s.start);
    if (spans.length === 0) return content;

    const points = new Set<number>([0, content.length]);
    spans.forEach((s) => {
      points.add(s.start);
      points.add(s.end);
    });
    const sorted = [...points].sort((a, b) => a - b);
    const out: React.ReactNode[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const s = sorted[i];
      const e = sorted[i + 1];
      if (e <= s) continue;
      const marked = spans.some((sp) => sp.start <= s && sp.end >= e);
      const chunk = content.slice(s, e);
      out.push(
        marked ? (
          <mark key={`m${i}`} className="hl-mark">
            {chunk}
          </mark>
        ) : (
          <span key={`s${i}`}>{chunk}</span>
        ),
      );
      // Pins for threads whose highlight ends at this boundary.
      spans
        .filter((sp) => sp.end === e)
        .forEach((sp) => {
          const count = 1 + (repliesByParent.get(sp.c.id)?.length ?? 0);
          out.push(
            <button
              key={`pin-${sp.c.id}`}
              data-pin
              type="button"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={(ev) => {
                ev.stopPropagation();
                openThreadAt(sp.c.id, ev.clientX, ev.clientY);
              }}
              title="查看討論"
              className="relative -top-1.5 mx-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 align-middle text-[10px] font-semibold leading-none"
              style={{
                background: "var(--accent)",
                color: "var(--text-inverse)",
              }}
            >
              <Icon name="message" size={10} />
              {count}
            </button>,
          );
        });
    }
    return out;
  }

  const openComment = openThread
    ? topLevel.find((c) => c.id === openThread.id)
    : null;

  return (
    <div className="w-full">
      {/* Identity line */}
      {discussionEnabled && (
        <div className="mb-4 flex items-center gap-2 text-xs text-muted">
          <Icon name="message" size={13} />
          <span>選取任一段回答文字即可留言。</span>
          {identity && (
            <button
              className="ml-auto hover:text-ink"
              onClick={() => setIdentityOpen(true)}
            >
              以「{identity.name ?? "匿名"}」· 更改
            </button>
          )}
        </div>
      )}

      <div onMouseUp={onMouseUp} className="space-y-8">
        {questions.map((q) => {
          const group = answers.filter((a) => a.question_key === q.key);
          return (
            <section key={q.key}>
              <h2 className="text-lg font-bold">{q.label}</h2>
              <p className="mb-3 text-xs text-muted">
                {group.length} 則回答
              </p>
              {group.length === 0 ? (
                <p className="text-sm text-muted">還沒有人回答這題。</p>
              ) : (
                <ul className="space-y-3">
                  {group.map((a) => (
                    <li key={a.id} className="card">
                      <p
                        data-answer-id={a.id}
                        className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink"
                      >
                        {renderAnnotated(
                          a.content,
                          anchorsByAnswer.get(a.id) ?? [],
                        )}
                      </p>
                      {!anonymous && a.author_name && (
                        <p className="mt-2 text-xs text-subtle">
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
      </div>

      {/* Floating "comment" button on selection */}
      {floating && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={startComment}
          style={{
            position: "fixed",
            left: floating.x,
            top: floating.y + 10,
            zIndex: 50,
            background: "var(--accent)",
            color: "var(--text-inverse)",
          }}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold shadow-lg"
        >
          <Icon name="message" size={13} />
          留言
        </button>
      )}

      {/* New-comment composer popover */}
      {composer && (
        <Popover x={composer.x} y={composer.y} onClose={() => setComposer(null)}>
          <form onSubmit={submitComment} className="space-y-2">
            <span className="inline-block rounded-[5px] bg-[color:var(--surface-2)] px-2 py-0.5 text-xs text-muted">
              「{composer.quote.slice(0, 80)}」
            </span>
            <textarea
              autoFocus
              rows={3}
              className="textarea"
              placeholder="寫下你的留言…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="btn-primary !h-8 !px-3 text-xs"
                disabled={submitting || !body.trim()}
              >
                {submitting ? "送出中…" : "送出"}
              </button>
              <button
                type="button"
                className="btn-ghost !h-8 !px-3 text-xs"
                onClick={() => setComposer(null)}
              >
                取消
              </button>
              {identity && (
                <span className="ml-auto text-[11px] text-subtle">
                  {identity.name ?? "匿名"}
                </span>
              )}
            </div>
          </form>
        </Popover>
      )}

      {/* Thread popover */}
      {openThread && openComment && (
        <Popover
          x={openThread.x}
          y={openThread.y}
          onClose={() => setOpenThread(null)}
        >
          <div className="mb-2 flex items-center justify-between">
            {openComment.quote ? (
              <span className="inline-block rounded-[5px] bg-[color:var(--surface-2)] px-2 py-0.5 text-xs text-muted">
                「{openComment.quote.slice(0, 60)}」
              </span>
            ) : (
              <span />
            )}
            <button
              className="text-subtle hover:text-ink"
              onClick={() => setOpenThread(null)}
              aria-label="關閉"
            >
              <Icon name="x" size={15} />
            </button>
          </div>

          <div className="max-h-64 space-y-3 overflow-y-auto">
            {/* Root message */}
            <div>
              <p className="whitespace-pre-wrap text-sm">{openComment.body}</p>
              <p className="mt-0.5 text-[11px] text-subtle">
                {openComment.author_name || "匿名"} ·{" "}
                {fmtTime(openComment.created_at)}
              </p>
            </div>
            {/* Replies */}
            {(repliesByParent.get(openComment.id) ?? []).map((r) => (
              <div key={r.id} className="border-l-2 border-[color:var(--surface-3)] pl-3">
                <p className="whitespace-pre-wrap text-sm">{r.body}</p>
                <p className="mt-0.5 text-[11px] text-subtle">
                  {r.author_name || "匿名"} · {fmtTime(r.created_at)}
                </p>
              </div>
            ))}
          </div>

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          {discussionEnabled && (
            <div className="mt-3 flex gap-2">
              <input
                className="textarea !h-8 text-sm"
                placeholder="回覆…"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                onFocus={() => {
                  if (!identity) {
                    requireIdentity({ kind: "reply", parentId: openComment.id }, () => {});
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!identity) {
                      requireIdentity(
                        { kind: "reply", parentId: openComment.id },
                        () => {},
                      );
                      return;
                    }
                    void submitReply(openComment.id);
                  }
                }}
              />
              <button
                className="btn-primary !h-8 !px-3 text-xs"
                disabled={submitting || !replyBody.trim()}
                onClick={() => {
                  if (!identity) {
                    requireIdentity(
                      { kind: "reply", parentId: openComment.id },
                      () => {},
                    );
                    return;
                  }
                  void submitReply(openComment.id);
                }}
              >
                送出
              </button>
            </div>
          )}
        </Popover>
      )}

      {/* Identity popup */}
      {identityOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setIdentityOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold">你是誰？</h3>
            <p className="mt-1 text-xs text-muted">
              選擇留言時顯示的身分，也可以匿名。
            </p>
            {!anonymous && rosterNames.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {rosterNames.map((n) => (
                  <button
                    key={n}
                    className="btn-ghost !h-8 !px-3 text-xs"
                    onClick={() => saveIdentity(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <input
                className="textarea !h-9 text-sm"
                placeholder="自行輸入名字"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <button
                className="btn-primary !h-9 !px-3 text-xs"
                disabled={!customName.trim()}
                onClick={() => saveIdentity(customName.trim())}
              >
                使用
              </button>
            </div>
            <button
              className="mt-3 text-xs text-muted hover:text-ink"
              onClick={() => saveIdentity(null)}
            >
              匿名留言
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Inline popover anchored to click coords; closes on outside click. */
function Popover({
  x,
  y,
  onClose,
  children,
}: {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const W = 320;
  const left = Math.min(Math.max(8, x), vw - W - 8);
  const top = Math.min(y + 12, vh - 220);
  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-[55] rounded-xl bg-white p-4 shadow-xl"
        style={{ left, top, width: W }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
}
