"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useT } from "@/lib/i18n/client";

export default function TeamModal({
  open,
  onboarding,
  initialName,
  initialSize,
  onClose,
  onSaved,
}: {
  open: boolean;
  onboarding: boolean;
  initialName: string;
  initialSize: number | null;
  onClose: () => void;
  onSaved: (name: string, size: number | null) => void;
}) {
  const { t } = useT();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [size, setSize] = useState(initialSize ? String(initialSize) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function save() {
    if (!name.trim()) {
      setError(t("team.name"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const parsed = parseInt(size, 10);
      const team_size = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), team_size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("team.saveFail"));
      onSaved(name.trim(), team_size);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("team.saveFail"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="overlay-in fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onClick={() => !onboarding && onClose()}
    >
      <div
        className="modal-pop w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-extrabold tracking-tight">
            {onboarding ? t("team.onboardTitle") : t("team.editTitle")}
          </h3>
          {!onboarding && (
            <button
              className="text-subtle hover:text-ink"
              onClick={onClose}
              aria-label={t("am.close")}
            >
              <Icon name="x" size={18} />
            </button>
          )}
        </div>
        {onboarding && (
          <p className="mb-4 text-sm text-muted">{t("team.onboardDesc")}</p>
        )}

        <div className="mt-3 space-y-3">
          <div>
            <label className="field-label">{t("team.name")}</label>
            <input
              autoFocus
              className="textarea"
              placeholder={t("team.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">{t("team.size")}</label>
            <input
              type="number"
              min={1}
              className="textarea"
              placeholder={t("team.sizePlaceholder")}
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted">{t("team.sizeHint")}</p>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex items-center justify-end gap-2">
          {onboarding && (
            <button
              className="btn-ghost"
              onClick={onClose}
              disabled={busy}
            >
              {t("team.skip")}
            </button>
          )}
          <button
            className="btn-primary"
            onClick={save}
            disabled={busy || !name.trim()}
          >
            {busy ? t("team.saving") : t("team.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
