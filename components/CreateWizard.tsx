"use client";

import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n/client";
import type { Anonymity, Template } from "@/lib/types";

function defaultDeadline(): string {
  const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function defaultName(teamName?: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
  return `${(teamName ?? "").trim() || "Retro"} · ${date}`;
}

export default function CreateWizard({
  templates,
  teamName,
}: {
  templates: Template[];
  teamName?: string | null;
}) {
  const { t: tr } = useT();
  const STEPS = [tr("cw.stepSetup"), tr("cw.stepTemplate")];
  const [step, setStep] = useState(0);

  const [name, setName] = useState(defaultName(teamName ?? undefined));
  const [anonymity, setAnonymity] = useState<Anonymity>("named");
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

  function next() {
    setError(null);
    if (step === 0) {
      const d = new Date(deadline);
      if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
        setError(tr("cw.deadlineErr"));
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
          name: name.trim(),
          template_id: templateId,
          anonymity,
          deadline: new Date(deadline).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? tr("cw.createFail"));
      setCreatedId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("cw.createFail"));
    } finally {
      setSubmitting(false);
    }
  }

  if (createdId) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold">{tr("cw.createdTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{tr("cw.createdDesc")}</p>
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
            {copied ? tr("cw.copied") : tr("cw.copy")}
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a className="btn-primary" href={`/s/${createdId}/results`}>
            {tr("cw.manageResults")}
          </a>
          <a className="btn-ghost" href="/dashboard">
            {tr("cw.backDashboard")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= step ? "bg-accent" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Step 1: name + anonymity + deadline */}
      {step === 0 && (
        <div className="card space-y-5">
          <div>
            <label className="field-label">{tr("cw.retroName")}</label>
            <input
              className="textarea"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tr("cw.retroName")}
            />
          </div>

          <div>
            <label className="field-label">{tr("cw.anonTitle")}</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "named", t: tr("cw.named"), d: tr("cw.namedDesc") },
                { v: "anonymous", t: tr("cw.anon"), d: tr("cw.anonDesc") },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setAnonymity(o.v as Anonymity)}
                  className={`rounded-lg p-3 text-left transition-colors ${
                    anonymity === o.v
                      ? "bg-[color:var(--accent-weak)]"
                      : "bg-[color:var(--surface-2)] hover:bg-[color:var(--surface-3)]"
                  }`}
                >
                  <span className="block text-sm font-medium">{o.t}</span>
                  <span className="block text-xs text-muted">{o.d}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">{tr("cw.deadline")}</label>
            <input
              type="datetime-local"
              className="textarea"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted">{tr("cw.deadlineHint")}</p>
          </div>
        </div>
      )}

      {/* Step 2: template */}
      {step === 1 && (
        <div className="space-y-3">
          {templates.map((t) => {
            const isSel = templateId === t.id;
            const open = preview === t.id;
            return (
              <div
                key={t.id}
                className="card"
                style={
                  isSel
                    ? { background: "var(--accent-weak)" }
                    : undefined
                }
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
                      className="mt-2 text-xs text-[color:var(--gold-700)] hover:underline"
                      onClick={() => setPreview(open ? null : t.id)}
                    >
                      {open ? tr("cw.previewHide") : tr("cw.previewShow")}
                    </button>
                    {open && (
                      <ul className="mt-2 space-y-2 rounded-lg bg-gray-50 p-3">
                        {t.questions.map((q) => (
                          <li key={q.key} className="text-xs">
                            <span className="font-medium">{q.label}</span>
                            {q.placeholder && (
                              <span className="mt-0.5 block text-muted">
                                {tr("cw.example", { text: q.placeholder })}
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
              {tr("cw.selected", { name: selected.name })}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          className="btn-ghost"
          onClick={back}
          disabled={step === 0 || submitting}
        >
          {tr("cw.prev")}
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn-primary" onClick={next}>
            {tr("cw.next")}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={submit}
            disabled={submitting || !templateId}
          >
            {submitting ? tr("cw.creating") : tr("cw.create")}
          </button>
        )}
      </div>
    </div>
  );
}
