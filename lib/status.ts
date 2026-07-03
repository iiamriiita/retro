export interface SessionStateInput {
  status: "open" | "closed";
  deadline: string;
  discussion_enabled: boolean;
  ai_report_at: string | null;
}

export interface SessionState {
  primary: { label: string; tone: "open" | "closed" };
  badges: string[];
}

// Derive the dashboard state from the orthogonal flags:
//   open (not past deadline)          → 進行中
//   closed / past deadline            → 已結束
//   + discussion_enabled              → 討論中 badge
//   + ai_report present               → AI報告已生成 badge
// Discussion and report are independent and may both be on.
export function deriveState(s: SessionStateInput): SessionState {
  const expired = new Date(s.deadline).getTime() <= Date.now();
  const isOpen = s.status === "open" && !expired;

  const badges: string[] = [];
  if (s.discussion_enabled) badges.push("討論中");
  if (s.ai_report_at) badges.push("AI 報告已生成");

  return {
    primary: isOpen
      ? { label: "進行中", tone: "open" }
      : { label: "已結束", tone: "closed" },
    badges,
  };
}
