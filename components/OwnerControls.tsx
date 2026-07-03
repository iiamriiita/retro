"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

export default function OwnerControls({
  sessionId,
  discussionEnabled,
  hasReport,
}: {
  sessionId: string;
  discussionEnabled: boolean;
  hasReport: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"discussion" | "report" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleDiscussion() {
    setBusy("discussion");
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/discussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !discussionEnabled }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "更新失敗");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setBusy(null);
    }
  }

  async function generateReport() {
    setBusy("report");
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/report`, {
        method: "POST",
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "產生失敗");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "產生失敗");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card mb-6">
      <p className="mb-3 text-sm font-medium">發起者控制台</p>
      <div className="flex flex-wrap gap-3">
        <button
          className={discussionEnabled ? "btn-ghost" : "btn-primary"}
          onClick={toggleDiscussion}
          disabled={busy !== null}
        >
          <Icon name={discussionEnabled ? "lock" : "unlock"} size={15} />
          {busy === "discussion"
            ? "處理中…"
            : discussionEnabled
              ? "關閉討論"
              : "開啟討論"}
        </button>
        <button
          className="btn-primary"
          onClick={generateReport}
          disabled={busy !== null}
        >
          <Icon name="sparkles" size={15} />
          {busy === "report"
            ? "生成中…（約 10–20 秒）"
            : hasReport
              ? "重新生成 AI 報告"
              : "生成 AI 報告"}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        討論與 AI 報告是獨立的，可以同時開。開啟討論後，分享連結的人就能一起選字留言。
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
