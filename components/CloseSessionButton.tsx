"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CloseSessionButton({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function close() {
    if (!confirm("結束後成員就無法再填寫，確定要結束嗎？")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/close`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "結束失敗");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "結束失敗");
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="btn-primary" onClick={close} disabled={busy}>
        {busy ? "結束中…" : "結束 session 並看結果"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
