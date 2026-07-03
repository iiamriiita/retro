"use client";

import { useMemo, useState } from "react";
import type { Anonymity, Template } from "@/lib/types";

// Default deadline: 3 days out, rounded to the hour, formatted for
// <input type="datetime-local"> in the user's local timezone.
function defaultDeadline(): string {
  const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default function CreateSessionForm({
  templates,
}: {
  templates: Template[];
}) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [anonymity, setAnonymity] = useState<Anonymity>("named");
  const [groupSize, setGroupSize] = useState(4);
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selected = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId],
  );

  const shareUrl =
    createdId && typeof window !== "undefined"
      ? `${window.location.origin}/s/${createdId}`
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: templateId,
          anonymity,
          deadline: new Date(deadline).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "建立失敗");
      setCreatedId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立失敗");
    } finally {
      setSubmitting(false);
    }
  }

  if (createdId) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold">Session 已建立 🎉</h2>
        <p className="mt-1 text-sm text-muted">
          把這個連結分享給小組成員，他們就能開始填寫。
        </p>
        <div className="mt-4 flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            className="textarea flex-1 !py-2"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            className="btn-ghost"
            onClick={async () => {
              await navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "已複製" : "複製"}
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a className="btn-primary" href={`/s/${createdId}/results`}>
            管理 / 結果
          </a>
          <a className="btn-ghost" href={`/s/${createdId}`}>
            預覽填寫頁
          </a>
          <a className="btn-ghost" href="/dashboard">
            回 Dashboard
          </a>
        </div>
        <p className="mt-4 text-xs text-muted">
          這場綁在你的帳號下，隨時可以從 Dashboard 進來管理。只有你能結束 session。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card space-y-4">
        <div>
          <label className="field-label">問卷模板</label>
          <div className="space-y-2">
            {templates.map((t) => (
              <label
                key={t.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  templateId === t.id
                    ? "border-accent bg-indigo-50/40"
                    : "border-line hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  className="mt-1"
                  checked={templateId === t.id}
                  onChange={() => setTemplateId(t.id)}
                />
                <span>
                  <span className="block text-sm font-medium">{t.name}</span>
                  <span className="block text-xs text-muted">
                    {t.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {selected && (
          <div className="rounded-lg bg-gray-50 p-3 text-xs text-muted">
            <span className="font-medium text-ink">包含題目：</span>
            <ul className="mt-1 list-disc pl-5">
              {selected.questions.map((q) => (
                <li key={q.key}>{q.label}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">匿名設定</label>
          <select
            className="textarea"
            value={anonymity}
            onChange={(e) => setAnonymity(e.target.value as Anonymity)}
          >
            <option value="named">顯示填寫者名字（named）</option>
            <option value="anonymous">不顯示身分（anonymous）</option>
          </select>
        </div>
        <div>
          <label className="field-label">小組人數上限（提示用）</label>
          <select
            className="textarea"
            value={groupSize}
            onChange={(e) => setGroupSize(Number(e.target.value))}
          >
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} 人
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">截止時間</label>
          <input
            type="datetime-local"
            className="textarea"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">
            過了截止時間，表單會自動鎖定不能再填。
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "建立中…" : "建立 session 並產生連結"}
      </button>
    </form>
  );
}
