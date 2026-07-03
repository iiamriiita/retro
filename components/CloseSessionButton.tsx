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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function close() {
    if (!confirm(t("csb.confirm"))) return;
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
      <button className="btn-primary" onClick={close} disabled={busy}>
        {busy ? t("csb.ending") : t("csb.endBtn")}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
