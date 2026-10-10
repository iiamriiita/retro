---
name: design-task
description: Run the Team Retro agent design flow for any UI implementation task in this repo — building or changing a page, component, visual style or micro-interaction. Use whenever the owner asks for UI work (「做／加／改 一個頁面、元件、樣式、動效」, "add a button/panel/page", "redesign X", "幫我做設計"), so the task goes through the fixed flow: written design plan with a mandatory state inventory → owner confirms → reuse ladder → build under the six constraints → machine-checkable audit → delivery with a three-line summary → owner verifies on the running product → formal revision record. Not for changing the design system itself — that is the design-system-update skill.
---

# Design task

Follow **`docs/agent-design-flow.md`** exactly (authoritative where this
summary differs). This is the enforcement flow — it applies the design
system; changing the system is `design-system-update`.

## Procedure

1. **Load the law** — read `docs/design-system/README.md` once per session
   (plus `motion.md` if motion is involved) before the first UI edit.
2. **Frame → written plan** — scope × content × **mandatory state
   inventory** (default · hover · focus · disabled · empty · loading ·
   error — the last three listed or explicitly N/A), plus the closest
   existing precedent in the product. Present the plan as a short list.
3. **Gate 1** — the owner confirms the plan. Stop until then (use
   AskUserQuestion when available). Words are cheap to change; built UI
   is not.
4. **Reuse ladder** — top-down, stop at the first rung that holds:
   ① import an existing component from `components/*` → ② apply an existing
   `globals.css` class → ③ compose from existing tokens (carving a new piece
   — it must be registered through `design-system-update` entry C after the
   task) → ④ tokens/rules missing → bridge into `design-system-update`
   (entry C), return when the vocabulary exists.
5. **Build under the six constraints** — `var(--token)` only · copy via
   `lib/i18n` · zh + en together · inline SVG imagery · motion on the
   duration scale behind `prefers-reduced-motion` · visible focus.
6. **Self-audit (machine-checkable)** — no off-whitelist hex (grep), no
   invented radius/shadow, one gold button per page, both locales present,
   focus-visible + reduced-motion guards, every Step-2 state accounted for,
   build passes. Fail → fix → re-audit.
7. **Deliver** — run the flow to completion in one pass; close with three
   lines: reused · carved new (and registration status) · remaining debt,
   plus where to verify (branch preview / deployed page).
8. **Gate 2 — owner verifies on the product** — the owner checks the live
   result (preview or production), never screenshots alone; requested
   changes → back to build (fix → re-audit → redeliver).
9. **Close out** — formal revision record: commit hash · files · the three
   lines; any carved piece's registration and `lastChange` already done.
