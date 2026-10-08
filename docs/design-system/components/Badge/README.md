Badges are small filled labels for status and counts; source tags are their round, clickable cousins on AI-report bullets. Hand-written from `app/globals.css` (`.badge*`) and `components/ReportPanel.tsx`.

## Badge

22px tall, `radius-sm`, caption type at weight 600, no border. Three fills: neutral (`surface-3` + `text-muted`), accent (`accent-weak` + `gold-700` — note the readable gold, never raw `accent` for text), success (`green-weak` + `green-500`).

## Source tag

An 18px `radius-pill` chip on `surface-3` showing a respondent's number (anonymous session) or name initial (named session). Clicking one scrolls to the cited answer and flashes it `accent-weak` — the chip is the proof that an AI bullet traces back to a real quote. The consumer provides the label and the jump target.
