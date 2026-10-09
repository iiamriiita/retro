The modal has **two sanctioned variants**, chosen by content weight. Both sit on the warm `overlay` dim, enter with the 160ms pop, and close on backdrop click; the gold primary is **one per view**, and destructive confirmations use danger with no gold anywhere in the window. Hand-written from AuthModal, TeamModal, the share dialog, the delete/close confirms and the report settings dialog.

## Panel (forms & content)

`surface` fill, `radius-xl`, 24px padding, `shadow-lg`. Size scale: forms max-w-md (448px); content-rich (e.g. share) max-w-lg (512px) — the content type may carry an X close in the top-right. Title in headline-sm, body in body-md.

## Hero header (the content panel's opener)

A content-rich panel may open with a **full-bleed hero band** (today's only case: the share dialog): a gold `linear-gradient(180deg, accent-hover → accent)` strip with a token-colored inline SVG illustration; the X close sits on the band — 36px, `radius-lg`, `hero-scrim` ground, `text-inverse` icon. This is the system's **only sanctioned gradient**; gradients must not leak into any other component.

## Card confirm (two-button decisions)

Built directly from `.card`: `radius-lg`, **deliberately shadowless** — the constitutional exception to "overlays lift" (see README principle 1) — at max-w-sm (384px). Anatomy: label-lg title + body-sm line + action row (ghost cancel + danger or gold confirm). It holds one sentence and two buttons; anything more upgrades to Panel.

## Behavior & the close convention

**Every Panel carries a top-right X**: the form type as a plain icon button (18px, `text-subtle`, hover to `text`, in the title row); the hero type as the `hero-scrim` rounded button on the band. Forced flows (e.g. first-run setup) may hide it temporarily. **Card confirm has no X** — Cancel is the close; a two-button box gets no third exit.
Backdrop click and Esc close it (`lib/useEscClose`, app-wide; disabled while busy); closing must never lose user input. Flows longer than two steps get a page, not a modal.

## Debt ledger (full remediation 2026-10-09 — all 6 cleared)

1. ✅ All 7 overlays now use the `overlay` token.
2. ✅ Modals unified on `shadow-lg`, menus/popovers on `shadow-md`; Tailwind's `rounded-*`/`shadow-*` classes are now mapped to the tokens, killing stray values at the pipeline.
3. ✅ The share dialog's `rounded-2xl` now resolves to `radius-xl` via the mapping; the `!h-11` overrides are gone (36px standard restored).
4. ✅ Esc-to-close implemented app-wide via `lib/useEscClose` (modals, menus, popovers; inert while busy).
5. ✅ The hero X ground is legislated as the `hero-scrim` token.
6. ✅ AuthModal gained the top-right X (Icon x 18px, `text-subtle` → hover `text`, matching TeamModal).
