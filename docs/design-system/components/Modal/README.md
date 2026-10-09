The modal has **two sanctioned variants**, chosen by content weight. Both sit on the warm `overlay` dim, enter with the 160ms pop, and close on backdrop click; the gold primary is **one per view**, and destructive confirmations use danger with no gold anywhere in the window. Hand-written from AuthModal, TeamModal, the share dialog, the delete/close confirms and the report settings dialog.

## Panel (forms & content)

`surface` fill, `radius-xl`, 24px padding, `shadow-lg`. Size scale: forms max-w-md (448px); content-rich (e.g. share) max-w-lg (512px) — the content type may carry an X close in the top-right. Title in headline-sm, body in body-md.

## Hero header (the content panel's opener)

A content-rich panel may open with a **full-bleed hero band** (today's only case: the share dialog): a gold `linear-gradient(180deg, accent-hover → accent)` strip with a token-colored inline SVG illustration; the X close sits on the band — 36px, `radius-lg`, 55%-white ground, `text-inverse` icon. This is the system's **only sanctioned gradient**; gradients must not leak into any other component.

## Card confirm (two-button decisions)

Built directly from `.card`: `radius-lg`, **deliberately shadowless** — the constitutional exception to "overlays lift" (see README principle 1) — at max-w-sm (384px). Anatomy: label-lg title + body-sm line + action row (ghost cancel + danger or gold confirm). It holds one sentence and two buttons; anything more upgrades to Panel.

## Behavior & the close convention

**Every Panel carries a top-right X**: the form type as a plain icon button (18px, `text-subtle`, hover to `text`, in the title row); the hero type as the 55%-white rounded button on the band. Forced flows (e.g. first-run setup) may hide it temporarily. **Card confirm has no X** — Cancel is the close; a two-button box gets no third exit.
Backdrop click and Esc close it (Esc unimplemented — see debts); closing must never lose user input. Flows longer than two steps get a page, not a modal.

## Debts (reality vs law, recorded honestly)

1. Six overlays use `bg-black/40` pure black — should be the `overlay` token (warm brown 30%).
2. Three panels and UserMenu use `shadow-xl` — should be `shadow-lg` for modals, `shadow-md` for menus.
3. The share dialog's `rounded-2xl` (16px, not a token radius) should be `radius-xl`; its `!h-11` buttons override the 36px standard.
4. Esc-to-close is unimplemented app-wide.
5. The hero X button’s `rgba(255,255,255,.55)` ground is a literal, not yet a token.
6. AuthModal lacks the top-right X (backdrop-only close) — inconsistent with TeamModal.
