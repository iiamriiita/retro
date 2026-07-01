"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { ChatTurn } from "@/lib/types";

const SEED =
  "請根據以上回答，幫我們產生總結與建議，聚焦主題歸納、正向亮點、待改善點，以及具體可行動的 next steps。";

export default function AiSummary({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followup, setFollowup] = useState("");

  async function ask(nextMessages: ChatTurn[]) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "產生失敗");
      setMessages([...nextMessages, { role: "model", text: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "產生失敗");
    } finally {
      setLoading(false);
    }
  }

  function generate() {
    void ask([{ role: "user", text: SEED }]);
  }

  function sendFollowup(e: React.FormEvent) {
    e.preventDefault();
    const q = followup.trim();
    if (!q || loading) return;
    setFollowup("");
    void ask([...messages, { role: "user", text: q }]);
  }

  const started = messages.length > 0;

  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="text-lg font-semibold">AI 助理</h2>
      <p className="mt-1 text-sm text-muted">
        把整場回答（去識別化）交給 AI，歸納主題、亮點、待改善與具體調整方向。可以接著追問。
      </p>

      {!started && (
        <button
          className="btn-primary mt-4"
          onClick={generate}
          disabled={loading}
        >
          {loading ? "產生中…" : "產生總結與建議"}
        </button>
      )}

      {started && (
        <div className="mt-5 space-y-4">
          {messages.map((m, i) =>
            m.role === "model" ? (
              <div
                key={i}
                className="prose-sm card max-w-none space-y-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:text-sm [&_ul]:my-2"
              >
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
            ) : (
              <div
                key={i}
                className="ml-auto max-w-[85%] rounded-lg bg-indigo-50 px-3 py-2 text-sm text-ink"
              >
                {m.text}
              </div>
            ),
          )}
          {loading && <p className="text-sm text-muted">思考中…</p>}
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {started && (
        <form onSubmit={sendFollowup} className="mt-4 flex gap-2">
          <input
            className="textarea flex-1 !py-2"
            placeholder="追問，例如：哪一項最該先做？"
            value={followup}
            onChange={(e) => setFollowup(e.target.value)}
            disabled={loading}
          />
          <button className="btn-ghost" disabled={loading || !followup.trim()}>
            送出
          </button>
        </form>
      )}
    </section>
  );
}
