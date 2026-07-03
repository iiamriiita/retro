"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { useT } from "@/lib/i18n/client";

export default function FormLinkButton({ sessionId }: { sessionId: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/s/${sessionId}`
      : `/s/${sessionId}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  // Faint decorative database marks scattered across the hero.
  const decos = [
    { top: "20%", left: "10%", size: 30, rotate: -12 },
    { top: "58%", left: "26%", size: 24, rotate: 8 },
    { top: "22%", left: "80%", size: 26, rotate: 14 },
    { top: "62%", left: "72%", size: 22, rotate: -8 },
  ];

  return (
    <>
      <button
        type="button"
        className="btn-ghost !py-1.5 text-xs"
        onClick={() => setOpen(true)}
      >
        {t("flb.trigger")}
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
            {/* Full-bleed hero */}
            <div
              className="relative flex flex-col items-center justify-center px-6 py-9"
              style={{
                background:
                  "linear-gradient(180deg, var(--accent-hover), var(--accent))",
              }}
            >
              {/* dotted grid */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(44,28,18,0.18) 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
              />
              {/* scattered marks */}
              {decos.map((d, i) => (
                <span
                  key={i}
                  className="pointer-events-none absolute"
                  style={{
                    top: d.top,
                    left: d.left,
                    transform: `translate(-50%,-50%) rotate(${d.rotate}deg)`,
                    color: "var(--text-inverse)",
                    opacity: 0.25,
                  }}
                >
                  <Icon name="database" size={d.size} />
                </span>
              ))}

              {/* close */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("am.close")}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--text-inverse)] transition-colors"
                style={{ background: "rgba(255,255,255,0.55)" }}
              >
                <Icon name="x" size={18} />
              </button>

              {/* logo mark */}
              <div className="relative rounded-2xl bg-white p-2.5 shadow-md">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-xl"
                  style={{
                    background: "var(--accent)",
                    color: "var(--text-inverse)",
                  }}
                >
                  <Icon name="database" size={30} />
                </span>
              </div>
              <p
                className="eyebrow relative mt-4"
                style={{ color: "var(--text-inverse)", opacity: 0.85 }}
              >
                {t("flb.inviteEyebrow")}
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              <h3 className="text-xl font-extrabold tracking-tight">
                {t("flb.shareTitle")}
              </h3>
              <p className="mt-1.5 text-sm text-muted">{t("flb.shareDesc")}</p>

              <p className="eyebrow mt-5">{t("flb.formLink")}</p>
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
                href={`/s/${sessionId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                <Icon name="external-link" size={15} />
                {t("flb.openNewTab")}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
