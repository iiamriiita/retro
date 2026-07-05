"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import FormLinkButton from "@/components/FormLinkButton";
import { useT } from "@/lib/i18n/client";

type ShareView = "both" | "report" | "raw";

// Owner-only sticky sidebar on the results page: discussion switch on top,
// shared-view content settings below.
export default function OwnerSidebar({
  sessionId,
  discussionEnabled,
  shareView,
  hasReport,
}: {
  sessionId: string;
  discussionEnabled: boolean;
  shareView: ShareView;
  hasReport: boolean;
}) {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState<"discussion" | "share" | null>(null);
  const [view, setView] = useState<ShareView>(shareView);
  const [error, setError] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);

  // Show our own share button only once the header's button scrolls away.
  useEffect(() => {
    const anchor = document.getElementById("share-top-anchor");
    if (!anchor) return;
    const io = new IntersectionObserver(
      ([e]) => setStuck(!e.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" },
    );
    io.observe(anchor);
    return () => io.disconnect();
  }, []);

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

  async function setShare(next: ShareView) {
    if (next === view || busy) return;
    setBusy("share");
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ view: next }),
      });
      if (!res.ok)
        throw new Error((await res.json())?.error ?? t("oc.updateFail"));
      setView(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("oc.updateFail"));
    } finally {
      setBusy(null);
    }
  }

  const shareOptions: { v: ShareView; tt: string; d: string }[] = [
    { v: "both", tt: t("os.shareBoth"), d: t("os.shareBothDesc") },
    {
      v: "report",
      tt: t("os.shareReportOnly"),
      d: t("os.shareReportOnlyDesc"),
    },
    { v: "raw", tt: t("os.shareRawOnly"), d: t("os.shareRawOnlyDesc") },
  ];

  return (
    <div className="space-y-4 md:sticky md:top-[76px] md:self-start">
      {/* Share results — grows in when the header button scrolls away */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          stuck ? "max-h-12 opacity-100" : "-mb-4 max-h-0 opacity-0"
        }`}
      >
        <FormLinkButton
          sessionId={sessionId}
          ended
          discussionEnabled={discussionEnabled}
          triggerClassName="btn-primary w-full"
        />
      </div>

      {/* Discussion — toggle switch */}
      <div className="card">
        <div className="flex items-center justify-between">
          <p className="eyebrow">{t("os.discussionTitle")}</p>
          <button
            type="button"
            role="switch"
            aria-checked={discussionEnabled}
            onClick={toggleDiscussion}
            disabled={busy !== null}
            className="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60"
            style={{
              background: discussionEnabled
                ? "var(--accent)"
                : "var(--surface-3)",
            }}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                discussionEnabled ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
        {discussionEnabled && (
          <p className="mt-2 text-xs text-muted">{t("os.discussionOnHint")}</p>
        )}
      </div>

      {/* Shared-view content */}
      <div className="card">
        <p className="eyebrow">{t("os.shareTitle")}</p>
        <p className="mt-2 text-xs text-muted">{t("os.shareHint")}</p>
        <div className="mt-3 space-y-2">
          {shareOptions.map((o) => {
            const needsReport = o.v === "report" && !hasReport;
            return (
              <div key={o.v} className="group relative">
                <button
                  type="button"
                  onClick={() => setShare(o.v)}
                  disabled={busy !== null || needsReport}
                  className="relative w-full rounded-lg p-3 text-left transition-colors disabled:cursor-not-allowed"
                  style={{
                    background:
                      view === o.v ? "var(--accent-weak)" : "var(--surface-2)",
                    opacity: needsReport ? 0.5 : undefined,
                  }}
                >
                  {view === o.v && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--text-inverse)]">
                      <Icon name="check" size={12} />
                    </span>
                  )}
                  <span className="block pr-6 text-sm font-medium">{o.tt}</span>
                  <span className="block text-xs text-muted">{o.d}</span>
                </button>
                {needsReport && (
                  <span
                    className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-max max-w-[220px] -translate-x-1/2 rounded-md px-2.5 py-1.5 text-xs font-medium text-white group-hover:block"
                    style={{ background: "var(--text)" }}
                  >
                    {t("os.needReport")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
