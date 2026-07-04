"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import ShareHeroArt from "@/components/ShareHeroArt";
import { useT } from "@/lib/i18n/client";

export default function FormLinkButton({
  sessionId,
  ended = false,
}: {
  sessionId: string;
  ended?: boolean;
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
        eyebrow: t("flb.shareResultEyebrow"),
        title: t("flb.shareResultTitle"),
        desc: t("flb.shareResultDesc"),
        linkLabel: t("flb.resultLink"),
        openNewTab: t("flb.openResultNewTab"),
      }
    : {
        trigger: t("flb.shareForm"),
        eyebrow: t("flb.inviteEyebrow"),
        title: t("flb.shareTitle"),
        desc: t("flb.shareDesc"),
        linkLabel: t("flb.formLink"),
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
        className="btn-ghost !py-1.5 text-xs"
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

              <p className="eyebrow mt-5">{tx.linkLabel}</p>
              <div className="mt-2 flex items-stretch gap-2">
                <input
                  readOnly
                  value={url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="textarea flex-1 font-mono text-xs"
                  style={{ height: "44px" }}
                />
                <button
                  type="button"
                  className="btn-primary !h-11 shrink-0 !px-5"
                  onClick={copy}
                >
                  <Icon name={copied ? "check" : "link"} size={15} />
                  {copied ? t("flb.copied") : t("flb.copy")}
                </button>
              </div>

              <a
                className="btn-ghost mt-3 !h-11 w-full"
                href={path}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                <Icon name="external-link" size={15} />
                {tx.openNewTab}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
