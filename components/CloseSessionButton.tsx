"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";

export default function CloseSessionButton({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function close() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/close`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? t("csb.endFail"));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("csb.endFail"));
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        className="btn-primary"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        disabled={busy}
      >
        {busy ? t("csb.ending") : t("csb.endBtn")}
      </button>
      {error && !open && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !busy && setOpen(false)}
          />
          <div className="card relative z-10 w-full max-w-sm">
            <h2 className="text-base font-bold">{t("csb.title")}</h2>
            <p className="mt-2 text-sm text-muted">{t("csb.confirm")}</p>
            {error && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                {t("rc.cancel")}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={close}
                disabled={busy}
              >
                {busy ? t("csb.ending") : t("csb.endConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
