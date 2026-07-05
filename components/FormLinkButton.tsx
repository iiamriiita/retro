"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import ShareHeroArt from "@/components/ShareHeroArt";
import { useT } from "@/lib/i18n/client";

export default function FormLinkButton({
  sessionId,
  ended = false,
  discussionEnabled = false,
  triggerClassName = "btn-ghost !py-1.5 text-xs",
}: {
  sessionId: string;
  ended?: boolean;
  discussionEnabled?: boolean;
  triggerClassName?: string;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // In progress → share the fill form; ended → share the results page.
  const path = ended ? `/s/${sessionId}/results` : `/s/${sessionId}`;
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}${path}`
      : path;

  const tx = ended
    ? {
        trigger: t("flb.shareResult"),
        title: t("flb.shareResultTitle"),
        desc: discussionEnabled
          ? t("flb.shareResultDesc")
          : t("flb.shareResultDescNoDisc"),
        openNewTab: t("flb.openResultNewTab"),
      }
    : {
        trigger: t("flb.shareForm"),
        title: t("flb.shareTitle"),
        desc: t("flb.shareDesc"),
        openNewTab: t("flb.openNewTab"),
      };

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        {tx.trigger}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Full-bleed hero illustration */}
            <div
              className="relative flex items-center justify-center overflow-hidden px-4 pt-4"
              style={{
                background:
                  "linear-gradient(180deg, var(--accent-hover), var(--accent))",
              }}
            >
              {/* close */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("am.close")}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--text-inverse)] transition-colors"
                style={{ background: "rgba(255,255,255,0.55)" }}
              >
                <Icon name="x" size={18} />
              </button>

              <ShareHeroArt className="w-full max-w-[440px]" />
            </div>

            {/* Body */}
            <div className="p-6">
              <h3 className="text-xl font-extrabold tracking-tight">
                {tx.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted">{tx.desc}</p>

              <input
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                className="textarea mt-5 w-full font-mono text-xs"
                style={{ height: "44px" }}
              />

              <div className="mt-3 flex gap-2">
                <a
                  className="btn-ghost !h-11 flex-1"
                  href={path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                >
                  <Icon name="external-link" size={15} />
                  {tx.openNewTab}
                </a>
                <button
                  type="button"
                  className="btn-primary !h-11 flex-1"
                  onClick={copy}
                >
                  <Icon name={copied ? "check" : "link"} size={15} />
                  {copied ? t("flb.copied") : t("flb.copy")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
