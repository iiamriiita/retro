"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useT } from "@/lib/i18n/client";

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
  const { t } = useT();
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
      if (!res.ok) throw new Error((await res.json())?.error ?? t("oc.updateFail"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("oc.updateFail"));
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
      if (!res.ok) throw new Error((await res.json())?.error ?? t("oc.genFail"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("oc.genFail"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card mb-6">
      <p className="mb-3 text-sm font-medium">{t("oc.title")}</p>
      <div className="flex flex-wrap gap-3">
        <button
          className={discussionEnabled ? "btn-ghost" : "btn-primary"}
          onClick={toggleDiscussion}
          disabled={busy !== null}
        >
          <Icon name={discussionEnabled ? "lock" : "unlock"} size={15} />
          {busy === "discussion"
            ? t("oc.processing")
            : discussionEnabled
              ? t("oc.closeDiscussion")
              : t("oc.openDiscussion")}
        </button>
        <button
          className="btn-primary"
          onClick={generateReport}
          disabled={busy !== null}
        >
          <Icon name="sparkles" size={15} />
          {busy === "report"
            ? t("oc.generating")
            : hasReport
              ? t("oc.regenReport")
              : t("oc.genReport")}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">{t("oc.hint")}</p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
