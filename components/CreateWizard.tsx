"use client";

import { useMemo, useState } from "react";
import type { Anonymity, Template } from "@/lib/types";

function defaultDeadline(): string {
  const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

const STEPS = ["身分 / 名單", "截止時間", "選問卷"];

export default function CreateWizard({ templates }: { templates: Template[] }) {
  const [step, setStep] = useState(0);

  const [anonymity, setAnonymity] = useState<Anonymity>("named");
  const [names, setNames] = useState<string[]>(["", "", "", ""]);
  const [allowAdhoc, setAllowAdhoc] = useState(true);
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [preview, setPreview] = useState<string | null>(null);

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

  function setName(i: number, v: string) {
    setNames((arr) => arr.map((n, idx) => (idx === i ? v : n)));
  }
  function addName() {
    setNames((arr) => [...arr, ""]);
  }
  function removeName(i: number) {
    setNames((arr) => arr.filter((_, idx) => idx !== i));
  }

  function next() {
    setError(null);
    if (step === 1) {
      const d = new Date(deadline);
      if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
        setError("截止時間必須在未來。");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
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
          group_size:
            anonymity === "named"
              ? names.filter((n) => n.trim()).length || names.length
              : names.length,
          allow_adhoc: anonymity === "named" ? allowAdhoc : true,
          participants: anonymity === "named" ? names : [],
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

  // ---- success ----
  if (createdId) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold">Retro 已建立 🎉</h2>
        <p className="mt-1 text-sm text-muted">
          把這個連結分享給成員，他們就能開始填寫。
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
          <a className="btn-ghost" href="/dashboard">
            回 Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* progress */}
      <ol className="flex items-center gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                i === step
                  ? "bg-accent text-white"
                  : i < step
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-muted"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className={i === step ? "font-medium" : "text-muted"}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="text-line">—</span>}
          </li>
        ))}
      </ol>

      {/* Step 1: identity / roster */}
      {step === 0 && (
        <div className="card space-y-5">
          <div>
            <label className="field-label">這場要匿名嗎？</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "named", t: "具名", d: "顯示填寫者名字" },
                { v: "anonymous", t: "匿名", d: "不顯示身分" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setAnonymity(o.v as Anonymity)}
                  className={`rounded-lg border p-3 text-left ${
                    anonymity === o.v
                      ? "border-accent bg-indigo-50/40"
                      : "border-line hover:bg-gray-50"
                  }`}
                >
                  <span className="block text-sm font-medium">{o.t}</span>
                  <span className="block text-xs text-muted">{o.d}</span>
                </button>
              ))}
            </div>
          </div>

          {anonymity === "named" ? (
            <div className="space-y-3">
              <div>
                <label className="field-label">成員名單</label>
                <p className="mb-2 text-xs text-muted">
                  先列出成員的名字，填寫時他們從名單選自己。可留空的之後再補。
                </p>
                <div className="space-y-2">
                  {names.map((n, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="textarea !py-2"
                        placeholder={`成員 ${i + 1}`}
                        value={n}
                        onChange={(e) => setName(i, e.target.value)}
                      />
                      {names.length > 1 && (
                        <button
                          type="button"
                          className="btn-ghost !px-3"
                          onClick={() => removeName(i)}
                          aria-label="移除"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-2 text-xs text-accent hover:underline"
                  onClick={addName}
                >
                  + 新增一位
                </button>
              </div>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={allowAdhoc}
                  onChange={(e) => setAllowAdhoc(e.target.checked)}
                />
                <span>
                  允許填寫時<strong>臨時新增</strong>不在名單上的成員
                  <span className="block text-xs text-muted">
                    關掉的話，只有名單上的人能填。
                  </span>
                </span>
              </label>
            </div>
          ) : (
            <div>
              <label className="field-label">預計人數（提示用）</label>
              <select
                className="textarea"
                value={names.length}
                onChange={(e) =>
                  setNames(Array(Number(e.target.value)).fill(""))
                }
              >
                {[2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} 人
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">
                匿名場不需要名單，填寫者不會顯示身分。
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: deadline */}
      {step === 1 && (
        <div className="card space-y-2">
          <label className="field-label">截止時間</label>
          <input
            type="datetime-local"
            className="textarea"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <p className="text-xs text-muted">
            過了截止時間，表單會自動鎖定不能再填。
          </p>
        </div>
      )}

      {/* Step 3: template */}
      {step === 2 && (
        <div className="space-y-3">
          {templates.map((t) => {
            const isSel = templateId === t.id;
            const open = preview === t.id;
            return (
              <div
                key={t.id}
                className={`card ${isSel ? "border-accent" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    className="mt-1"
                    checked={isSel}
                    onChange={() => setTemplateId(t.id)}
                  />
                  <div className="flex-1">
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => setTemplateId(t.id)}
                    >
                      <span className="block text-sm font-medium">{t.name}</span>
                      <span className="block text-xs text-muted">
                        {t.description}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="mt-2 text-xs text-accent hover:underline"
                      onClick={() => setPreview(open ? null : t.id)}
                    >
                      {open ? "收起預覽" : "預覽題目"}
                    </button>
                    {open && (
                      <ul className="mt-2 space-y-2 rounded-lg bg-gray-50 p-3">
                        {t.questions.map((q) => (
                          <li key={q.key} className="text-xs">
                            <span className="font-medium">{q.label}</span>
                            {q.placeholder && (
                              <span className="mt-0.5 block text-muted">
                                例：{q.placeholder}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {selected && (
            <p className="text-xs text-muted">
              已選：<span className="font-medium">{selected.name}</span>
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* nav */}
      <div className="flex justify-between">
        <button
          type="button"
          className="btn-ghost"
          onClick={back}
          disabled={step === 0 || submitting}
        >
          上一步
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn-primary" onClick={next}>
            下一步
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={submit}
            disabled={submitting || !templateId}
          >
            {submitting ? "建立中…" : "建立並產生連結"}
          </button>
        )}
      </div>
    </div>
  );
}
