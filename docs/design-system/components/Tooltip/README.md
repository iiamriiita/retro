A tooltip is a one-line explainer that floats on hover — one style app-wide, reverse-engineered from TeamInsights' info hints, the results page's status badge and the sidebar's locked-button hint.

## Structure

`tooltip-ink` deep warm-brown ground (the UI's one dark surface) + `tooltip-text` white text (the only pure white allowed), `radius-md`, px-2.5 py-1.5, 12px/500 type, max-w 220–240px, no arrow, no shadow — the dark ground separates by itself. Positioned directly above the trigger (bottom-full, centered or left-flush), 6px gap, `z-20`, `pointer-events-none`.

## Trigger & content

Shown via CSS `group-hover` (hidden → block), no delay, no motion. The trigger is usually a 13px info icon. Copy stays within one sentence; if it doesn't fit, it isn't a tooltip — use fixed helper text instead.

## Known debt

Hover-only: keyboard focus and touch devices never see it. Therefore **critical information must never live only in a tooltip**; an accessibility pass is on the backlog.
