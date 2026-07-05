"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useT } from "@/lib/i18n/client";

// Owner-only sticky sidebar on the results page: discussion switch on top,
// shared-view content settings below.
export default function OwnerSidebar({
  sessionId,
  discussionEnabled,
  shareShowRaw,
}: {
  sessionId: string;
  discussionEnabled: boolean;
  shareShowRaw: boolean;
}) {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState<"discussion" | "share" | null>(null);
  const [showRaw, setShowRaw] = useState(shareShowRaw);
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
      if (!res.ok)
        throw new Error((await res.json())?.error ?? t("oc.updateFail"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("oc.updateFail"));
    } finally {
      setBusy(null);
    }
  }

  async function setShare(next: boolean) {
    if (next === showRaw || busy) return;
    setBusy("share");
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show_raw: next }),
      });
      if (!res.ok)
        throw new Error((await res.json())?.error ?? t("oc.updateFail"));
      setShowRaw(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("oc.updateFail"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4 md:sticky md:top-[76px] md:self-start">
      {/* Discussion */}
      <div className="card">
        <p className="eyebrow">{t("os.discussionTitle")}</p>
        <p className="mt-2 text-xs text-muted">{t("oc.hint")}</p>
        <button
          className={`mt-3 w-full ${discussionEnabled ? "btn-ghost" : "btn-primary"}`}
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
      </div>

      {/* Shared-view content */}
      <div className="card">
        <p className="eyebrow">{t("os.shareTitle")}</p>
        <p className="mt-2 text-xs text-muted">{t("os.shareHint")}</p>
        <div className="mt-3 space-y-2">
          {(
            [
              { v: true, tt: t("os.shareBoth"), d: t("os.shareBothDesc") },
              { v: false, tt: t("os.shareReportOnly"), d: t("os.shareReportOnlyDesc") },
            ] as const
          ).map((o) => (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => setShare(o.v)}
              disabled={busy !== null}
              className="relative w-full rounded-lg p-3 text-left transition-colors"
              style={{
                background:
                  showRaw === o.v ? "var(--accent-weak)" : "var(--surface-2)",
              }}
            >
              {showRaw === o.v && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--text-inverse)]">
                  <Icon name="check" size={12} />
                </span>
              )}
              <span className="block text-sm font-medium">{o.tt}</span>
              <span className="block text-xs text-muted">{o.d}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
