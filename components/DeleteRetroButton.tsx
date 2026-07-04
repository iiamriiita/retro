"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useT } from "@/lib/i18n/client";

export default function DeleteRetroButton({ sessionId }: { sessionId: string }) {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function del() {
    if (!confirm(t("dash.deleteConfirm"))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/delete`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setBusy(false);
      alert(t("dash.deleteFail"));
    }
  }

  return (
    <button
      type="button"
      onClick={del}
      disabled={busy}
      aria-label={t("dash.delete")}
      title={t("dash.delete")}
      className="btn-ghost !px-2.5 text-muted hover:text-[color:var(--red-500)]"
    >
      <Icon name="trash" size={15} />
    </button>
  );
}
