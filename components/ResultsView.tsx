import type { PublicAnswer, Question } from "@/lib/types";

// Read-only grouped results (Phase 1). Select-to-comment + AI summary arrive in
// Phase 2 — this component is where they'll hang off.
export default function ResultsView({
  questions,
  answers,
  anonymous,
}: {
  questions: Question[];
  answers: PublicAnswer[];
  anonymous: boolean;
}) {
  return (
    <div className="space-y-8">
      {questions.map((q) => {
        const group = answers.filter((a) => a.question_key === q.key);
        return (
          <section key={q.key}>
            <h2 className="text-base font-semibold">{q.label}</h2>
            <p className="mb-3 text-xs text-muted">{group.length} 則回答</p>
            {group.length === 0 ? (
              <p className="text-sm text-muted">還沒有人回答這題。</p>
            ) : (
              <ul className="space-y-3">
                {group.map((a) => (
                  <li key={a.id} className="card">
                    <p className="whitespace-pre-wrap text-sm text-ink">
                      {a.content}
                    </p>
                    {!anonymous && a.author_name && (
                      <p className="mt-2 text-xs text-muted">
                        — {a.author_name}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
