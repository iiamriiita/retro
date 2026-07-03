export interface SessionStateInput {
  status: "open" | "closed";
  deadline: string;
  discussion_enabled: boolean;
  ai_report_at: string | null;
}

export interface SessionState {
  primary: { key: string; tone: "open" | "closed" };
  badgeKeys: string[];
}

// Derive the dashboard state from the orthogonal flags. Labels are returned as
// i18n keys (translated in the component), not literal text:
//   open (not past deadline)  → status.open
//   closed / past deadline    → status.closed
//   + discussion_enabled      → status.discussing badge
//   + ai_report present       → status.reportReady badge
// Discussion and report are independent and may both be on.
export function deriveState(s: SessionStateInput): SessionState {
  const expired = new Date(s.deadline).getTime() <= Date.now();
  const isOpen = s.status === "open" && !expired;

  const badgeKeys: string[] = [];
  if (s.discussion_enabled) badgeKeys.push("status.discussing");
  if (s.ai_report_at) badgeKeys.push("status.reportReady");

  return {
    primary: isOpen
      ? { key: "status.open", tone: "open" }
      : { key: "status.closed", tone: "closed" },
    badgeKeys,
  };
}
