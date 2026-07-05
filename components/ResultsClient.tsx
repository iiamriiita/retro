"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import Icon from "@/components/Icon";
import QuestionIcon from "@/components/QuestionIcon";
import { useT } from "@/lib/i18n/client";
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
  moodByAuthor = {},
  moodEntries = [],
}: {
  sessionId: string;
  anonymous: boolean;
  discussionEnabled: boolean;
  questions: Question[];
  answers: PublicAnswer[];
  initialComments: PublicComment[];
  rosterNames: string[];
  moodByAuthor?: Record<string, { score: number; emoji: string; reason: string }>;
  moodEntries?: {
    key: string;
    author_name: string | null;
    score: number;
    emoji: string;
    reason: string;
  }[];
}) {
  const { t } = useT();
  const [comments, setComments] = useState<PublicComment[]>(initialComments);
  const [groupBy, setGroupBy] = useState<"question" | "person">("question");
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
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
    if (!res.ok) throw new Error(data?.error ?? t("rc.commentFail"));
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
      setError(err instanceof Error ? err.message : t("rc.commentFail"));
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
      setError(err instanceof Error ? err.message : t("rc.replyFail"));
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
              title={t("rc.responses", { n: count })}
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
      {/* Identity strip — its own layer peeking out above the card */}
      {discussionEnabled && (
        <div
          className="-mb-6 flex items-center gap-2 rounded-t-xl px-[1.375rem] pb-9 pt-3 text-xs text-muted"
          style={{ background: "var(--accent-weak)" }}
        >
          <Icon name="message" size={13} />
          <span>{t("rc.hint")}</span>
          {identity && (
            <button
              className="ml-auto hover:text-ink"
              onClick={() => setIdentityOpen(true)}
            >
              {t("rc.asIdentity", { name: identity.name ?? t("rc.anonymous") })}
            </button>
          )}
        </div>
      )}

      <div className="card relative">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <span style={{ color: "var(--accent)" }}>
            <Icon name="list" size={19} />
          </span>
          {t("res.raw")}
        </h2>
        <div className="relative">
          <button
            type="button"
            onClick={() => setGroupMenuOpen((o) => !o)}
            onBlur={() => setTimeout(() => setGroupMenuOpen(false), 120)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            {t(groupBy === "question" ? "res.groupQuestion" : "res.groupPerson")}
            <Icon
              name="chevron-down"
              size={14}
              className={`transition-transform ${groupMenuOpen ? "rotate-180" : ""}`}
            />
          </button>
          {groupMenuOpen && (
            <div
              className="absolute right-0 top-full z-30 mt-1 w-max overflow-hidden rounded-lg bg-white p-1"
              style={{ boxShadow: "var(--shadow-md)" }}
            >
              {(
                [
                  { v: "question", label: t("res.groupQuestion") },
                  { v: "person", label: t("res.groupPerson") },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => {
                    setGroupBy(o.v);
                    setGroupMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-[color:var(--surface-2)]"
                >
                  <span
                    className="w-4"
                    style={{ color: "var(--accent)" }}
                  >
                    {groupBy === o.v && <Icon name="check" size={15} strokeWidth={3} />}
                  </span>
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div onMouseUp={onMouseUp} className="space-y-8">
        {groupBy === "question"
          ? (
            <>
              {questions.map((q) => {
              const group = answers.filter((a) => a.question_key === q.key);
              return (
                <section key={q.key}>
                  <h2 className="flex items-center gap-2 font-body text-[15px] font-medium leading-snug tracking-normal">
                    <QuestionIcon qKey={q.key} size={19} />
                    {q.label}
                  </h2>
                  <p className="mb-3 text-xs text-muted">
                    {t("rc.responses", { n: group.length })}
                  </p>
                  {group.length === 0 ? (
                    <p className="text-sm text-muted">{t("rc.noAnswers")}</p>
                  ) : (
                    <ul className="space-y-3">
                      {group.map((a) => (
                        <li
                          key={a.id}
                          className="rounded-xl p-4"
                          style={{ background: "var(--surface-2)" }}
                        >
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
              {moodEntries.length > 0 && (
                <section>
                  <h2 className="font-body text-[15px] font-medium leading-snug tracking-normal">
                    {t("res.moodWhy")}
                  </h2>
                  <p className="mb-3 text-xs text-muted">
                    {t("rc.responses", { n: moodEntries.length })}
                  </p>
                  <ul className="space-y-3">
                    {moodEntries.map((e) => (
                      <li
                        key={e.key}
                        className="rounded-xl p-4"
                        style={{ background: "var(--surface-2)" }}
                      >
                        <p className="text-[15px] leading-relaxed text-ink">
                          <span className="font-semibold">
                            {e.emoji} {e.score}/5
                          </span>{" "}
                          — {e.reason}
                        </p>
                        {!anonymous && e.author_name && (
                          <p className="mt-2 text-xs text-subtle">
                            — {e.author_name}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )
          : Array.from(new Set(answers.map((a) => a.author_key)))
              .sort((a, b) => Number(a) - Number(b))
              .map((pk) => {
                const group = answers.filter((a) => a.author_key === pk);
                const label =
                  group[0]?.author_name ?? t("res.respondentN", { n: pk });
                const qByKey = new Map(questions.map((q) => [q.key, q]));
                const mood = moodByAuthor[pk];
                return (
                  <section key={pk}>
                    <h2 className="font-body text-[15px] font-medium leading-snug tracking-normal">
                      {label}
                    </h2>
                    <p className="mb-3 mt-0.5 text-xs text-muted">
                      {t("rc.responses", { n: group.length })}
                    </p>
                    <ul className="space-y-3">
                      {group.map((a) => (
                        <li
                          key={a.id}
                          className="rounded-xl p-4"
                          style={{ background: "var(--surface-2)" }}
                        >
                          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted">
                            <QuestionIcon qKey={a.question_key} size={14} />
                            {qByKey.get(a.question_key)?.label ?? a.question_key}
                          </p>
                          <p
                            data-answer-id={a.id}
                            className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink"
                          >
                            {renderAnnotated(
                              a.content,
                              anchorsByAnswer.get(a.id) ?? [],
                            )}
                          </p>
                        </li>
                      ))}
                      {mood && (
                        <li
                          className="rounded-xl p-4"
                          style={{ background: "var(--surface-2)" }}
                        >
                          <p className="mb-1.5 text-xs font-medium text-muted">
                            {t("res.moodWhy")}
                          </p>
                          <p className="text-[15px] leading-relaxed text-ink">
                            <span className="font-semibold">
                              {mood.emoji} {mood.score}/5
                            </span>
                            {mood.reason ? <> — {mood.reason}</> : null}
                          </p>
                        </li>
                      )}
                    </ul>
                  </section>
                );
              })}
      </div>
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
          {t("rc.commentBtn")}
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
              placeholder={t("rc.writeComment")}
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
                {submitting ? t("rc.submitting") : t("rc.submit")}
              </button>
              <button
                type="button"
                className="btn-ghost !h-8 !px-3 text-xs"
                onClick={() => setComposer(null)}
              >
                {t("rc.cancel")}
              </button>
              {identity && (
                <span className="ml-auto text-[11px] text-subtle">
                  {identity.name ?? t("rc.anonymous")}
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
              aria-label={t("am.close")}
            >
              <Icon name="x" size={15} />
            </button>
          </div>

          <div className="max-h-64 space-y-3 overflow-y-auto">
            {/* Root message */}
            <div>
              <p className="whitespace-pre-wrap text-sm">{openComment.body}</p>
              <p className="mt-0.5 text-[11px] text-subtle">
                {openComment.author_name || t("rc.anonymous")} ·{" "}
                {fmtTime(openComment.created_at)}
              </p>
            </div>
            {/* Replies */}
            {(repliesByParent.get(openComment.id) ?? []).map((r) => (
              <div key={r.id} className="border-l-2 border-[color:var(--surface-3)] pl-3">
                <p className="whitespace-pre-wrap text-sm">{r.body}</p>
                <p className="mt-0.5 text-[11px] text-subtle">
                  {r.author_name || t("rc.anonymous")} · {fmtTime(r.created_at)}
                </p>
              </div>
            ))}
          </div>

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          {discussionEnabled && (
            <div className="mt-3 flex gap-2">
              <input
                className="textarea !h-8 text-sm"
                placeholder={t("rc.reply")}
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
                {t("rc.submit")}
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
            <h3 className="text-sm font-semibold">{t("rc.whoTitle")}</h3>
            <p className="mt-1 text-xs text-muted">{t("rc.whoDesc")}</p>
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
                placeholder={t("rc.customName")}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <button
                className="btn-primary !h-9 !px-3 text-xs"
                disabled={!customName.trim()}
                onClick={() => saveIdentity(customName.trim())}
              >
                {t("rc.use")}
              </button>
            </div>
            <button
              className="mt-3 text-xs text-muted hover:text-ink"
              onClick={() => saveIdentity(null)}
            >
              {t("rc.anonComment")}
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
