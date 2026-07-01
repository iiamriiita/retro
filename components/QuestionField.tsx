"use client";

import type { Question } from "@/lib/types";

export type FieldStatus = "idle" | "checking" | "ok" | "revise";

export default function QuestionField({
  question,
  value,
  status,
  suggestion,
  onChange,
  onBlur,
}: {
  question: Question;
  value: string;
  status: FieldStatus;
  suggestion: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const revise = status === "revise";
  return (
    <div className="card">
      <label className="field-label" htmlFor={question.key}>
        {question.label}
      </label>
      <textarea
        id={question.key}
        rows={3}
        className={`textarea ${
          revise ? "border-amber-400 focus:border-amber-400 focus:ring-amber-400" : ""
        }`}
        placeholder={question.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />

      <div className="mt-2 min-h-[1.25rem] text-xs">
        {status === "checking" && (
          <span className="text-muted">正在確認回饋是否有建設性…</span>
        )}
        {status === "ok" && value.trim() && (
          <span className="text-emerald-600">看起來很好 👍</span>
        )}
        {revise && (
          <div className="rounded-lg bg-amber-50 p-2 text-amber-800">
            {suggestion ||
              "這段可以更有建設性一點——試著補上具體發生了什麼，以及你希望怎麼調整 🙂"}
          </div>
        )}
      </div>
    </div>
  );
}
