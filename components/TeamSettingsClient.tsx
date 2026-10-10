"use client";

import { useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import Icon from "@/components/Icon";

export default function TeamSettingsClient({
  initialName,
  initialSize,
  sessionCount,
}: {
  initialName: string;
  initialSize: number | null;
  sessionCount: number;
}) {
  const { t } = useT();
  const [name, setName] = useState(initialName);
  const [size, setSize] = useState(initialSize ? String(initialSize) : "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [exporting, setExporting] = useState<"csv" | "md" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) {
      setError(t("team.name"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const parsed = parseInt(size, 10);
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          team_size: Number.isFinite(parsed) ? parsed : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("team.saveFail"));
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("team.saveFail"));
    } finally {
      setBusy(false);
    }
  }

  async function exportAs(format: "csv" | "md") {
    setExportError(null);
    setExporting(format);
    try {
      const res = await fetch(`/api/export?format=${format}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `team-retro-export.${format === "csv" ? "csv" : "md"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(t("ts.exportFail"));
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <section className="card">
        <h2 className="text-lg font-bold">{t("ts.profile")}</h2>
        <div className="mt-4">
          <label className="field-label" htmlFor="ts-name">
            {t("team.name")}
          </label>
          <input
            id="ts-name"
            className="textarea"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("team.namePlaceholder")}
          />
        </div>
        <div className="mt-4">
          <label className="field-label" htmlFor="ts-size">
            {t("team.size")}
          </label>
          <input
            id="ts-size"
            className="textarea w-32"
            inputMode="numeric"
            value={size}
            onChange={(e) => setSize(e.target.value.replace(/[^\d]/g, ""))}
            placeholder={t("team.sizePlaceholder")}
          />
          <p className="mt-1 text-xs text-muted">{t("team.sizeHint")}</p>
        </div>
        {error && (
          <p
            className="mt-3 text-sm text-[color:var(--red-500)]"
            role="alert"
          >
            {error}
          </p>
        )}
        <div className="mt-5 flex items-center justify-end gap-3">
          {saved && (
            <span className="pop inline-flex items-center gap-1 text-xs text-muted">
              <Icon name="check" size={13} />
              {t("ts.saved")}
            </span>
          )}
          <button
            type="button"
            className="btn-primary"
            onClick={save}
            disabled={busy || !name.trim()}
          >
            {busy ? t("team.saving") : t("team.save")}
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-bold">{t("ts.exportTitle")}</h2>
        <p className="mt-1 text-sm text-muted">
          {sessionCount === 0 ? t("ts.exportEmpty") : t("ts.exportDesc")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost"
            disabled={sessionCount === 0 || exporting !== null}
            onClick={() => exportAs("csv")}
          >
            <Icon name="database" size={15} />
            {exporting === "csv" ? t("ts.exporting") : t("ts.exportCsv")}
          </button>
          <button
            type="button"
            className="btn-ghost"
            disabled={sessionCount === 0 || exporting !== null}
            onClick={() => exportAs("md")}
          >
            <Icon name="list" size={15} />
            {exporting === "md" ? t("ts.exporting") : t("ts.exportMd")}
          </button>
        </div>
        {exportError && (
          <p
            className="mt-3 text-sm text-[color:var(--red-500)]"
            role="alert"
          >
            {exportError}
          </p>
        )}
        {sessionCount > 0 && (
          <p className="mt-3 text-xs text-subtle">{t("ts.exportNote")}</p>
        )}
      </section>
    </div>
  );
}
