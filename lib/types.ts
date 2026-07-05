export type Anonymity = "anonymous" | "named";
export type SessionStatus = "open" | "closed";

export interface RoleOption {
  emoji: string;
  label: string;
  desc: string;
}
export interface ScaleLevel {
  value: number; // 1–5
  emoji: string;
  label: string;
}

export interface Question {
  key: string;
  label: string;
  placeholder?: string;
  // text = free text (default); rating = 1–5 mood scale; role = pick one + why
  type?: "text" | "rating" | "role";
  options?: RoleOption[]; // role picker choices
  scale?: ScaleLevel[]; // themed 1–5 rating levels
  lowNudge?: string; // gentle prompt shown when a rating of ≤2 is picked
}

export interface Template {
  id: string;
  name: string;
  description: string;
  intro?: string; // opening line shown at the top of the fill flow
  invite?: string; // fill-page invitation; may contain a {team} placeholder
  questions: Question[];
}

export interface Session {
  id: string;
  template_id: string;
  anonymity: Anonymity;
  deadline: string; // ISO
  status: SessionStatus;
  created_at: string;
}

export interface Answer {
  id: string;
  session_id: string;
  participant_id: string;
  question_key: string;
  content: string;
  created_at: string;
}

// Moderation verdict returned by /api/moderate.
export type ModerateReason =
  | "insulting"
  | "non_constructive"
  | "purely_emotional";

export interface ModerateResult {
  verdict: "ok" | "revise";
  reasons: ModerateReason[];
  suggestion: string;
}

// Safe, de-identified answer shape sent to the results client (no author fields
// in anonymous mode).
export interface PublicAnswer {
  id: string;
  question_key: string;
  content: string;
  author_name: string | null;
  /** Stable per-respondent index ("1", "2", …) for grouping by person. */
  author_key: string;
}

// A discussion comment. Top-level comments anchor to a quote (quote/offsets set,
// parent_id null); replies belong to a parent (parent_id set, no anchor).
export interface PublicComment {
  id: string;
  answer_id: string;
  parent_id: string | null;
  quote: string | null;
  quote_start: number | null;
  quote_end: number | null;
  body: string;
  author_name: string | null;
  created_at: string;
}

// One turn of the AI-summary conversation.
export interface ChatTurn {
  role: "user" | "model";
  text: string;
}
