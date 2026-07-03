"use client";

import { useState } from "react";

export default function FormLinkButton({ sessionId }: { sessionId: string }) {
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

  return (
    <>
      <button
        type="button"
        className="btn-ghost !py-1.5 text-xs"
        onClick={() => setOpen(true)}
      >
        retro form
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold">Retro 表單</h3>
            <p className="mt-1 break-all text-xs text-muted">{url}</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="btn-primary text-sm"
                onClick={copy}
              >
                {copied ? "已複製連結 ✓" : "複製連結"}
              </button>
              <a
                className="btn-ghost text-sm"
                href={`/s/${sessionId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                在新分頁開啟表單
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
