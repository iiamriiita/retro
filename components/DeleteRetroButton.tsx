"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useT } from "@/lib/i18n/client";

export default function DeleteRetroButton({ sessionId }: { sessionId: string }) {
  const { t } = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function confirmDelete() {
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/delete`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setBusy(false);
      setFailed(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFailed(false);
          setOpen(true);
        }}
        aria-label={t("dash.delete")}
        title={t("dash.delete")}
        className="inline-flex h-9 items-center justify-center px-2.5 text-[color:var(--text-subtle)] transition-colors hover:text-[color:var(--text)]"
      >
        <Icon name="trash" size={16} />
      </button>

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
            <h2 className="text-base font-bold">{t("dash.deleteTitle")}</h2>
            <p className="mt-2 text-sm text-muted">{t("dash.deleteConfirm")}</p>
            {failed && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {t("dash.deleteFail")}
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
                className="btn-danger"
                onClick={confirmDelete}
                disabled={busy}
              >
                <Icon name="trash" size={15} />
                {t("dash.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
