export type Anonymity = "anonymous" | "named";
export type SessionStatus = "open" | "closed";

export interface Question {
  key: string;
  label: string;
  placeholder?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
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
