# Agent design flow

How an agent executes everyday UI work **under** the design system — the
enforcement counterpart to `docs/design-system-workflow.md` (which governs
changing the system itself). Every UI task in this repo — a new page, a new
component, a visual change, a micro-interaction — follows these steps.

## Step 1 · Load the law

`CLAUDE.md` is auto-loaded. Before the first UI edit of a session, read
`docs/design-system/README.md` (the six principles). If the task involves
motion, also read `docs/design-system/motion.md`.

## Step 2 · Frame the task → written design plan

Translate the request into a design plan:

- **Scope**: page / component × content.
- **State inventory — mandatory enumeration**: default · hover · focus ·
  disabled · **empty · loading · error**. The last three are the ones every
  designer forgets; list what each will show, or mark it explicitly N/A.
- **Precedent**: name the closest existing page/pattern in the product.

Present the plan as a short written list.

## Gate 1 — owner confirms the design plan

Stop until the owner approves the plan. Changing words is cheap; changing
built UI is not.

## Step 3 · Check the inventory (reuse ladder)

Walk top-down and stop at the first rung that holds:

1. An existing React component fits → `import` it.
2. An existing `globals.css` class fits → apply the `className`.
3. Existing tokens can compose it → carve a new piece (styles reference
   tokens only). **A carved component is a system change: after the task,
   register it through `docs/design-system-workflow.md` (entry C) so it
   joins the library and the docs.**
4. Even tokens/rules are missing → **bridge**: jump to the update workflow
   (entry C proposal, two gates, sources → product → projections), then
   return here with the new vocabulary.

## Step 4 · Build under the six constraints

- Styles reference `var(--token)` only — no literal hex/px-radius/shadow.
- All copy goes through `lib/i18n` — never hardcoded in components.
- English and Traditional Chinese ship **together**, same delivery.
- Imagery is inline SVG colored with tokens (wordmark excepted).
- Motion picks durations from the motion scale and sits behind
  `prefers-reduced-motion`.
- Focus is visible (`:focus-visible` with `--focus-ring`).

## Step 5 · Self-audit (machine-checkable)

- [ ] `grep` finds no hex values outside the token whitelist
- [ ] no invented radius / shadow values
- [ ] one primary (gold) button per page
- [ ] every string exists in both locales
- [ ] `:focus-visible` present; animations behind reduced-motion
- [ ] every state from Step 2 is accounted for (incl. empty / error)
- [ ] the build passes

Any failure → back to Step 4, fix, re-audit.

## Step 6 · Deliver

Run the full flow to completion in one pass, closing with a three-line
summary: what was **reused** · what was **carved new** (and its registration
status) · what **debt** remains — and point the owner at where to verify
(the branch's Vercel preview, or the deployed page).

## Gate 2 — owner verifies on the product

The owner checks the result **on the running product** (preview deployment
or production), never on screenshots alone. Approval closes the task;
requested changes go back to Step 4 (fix → re-audit → redeliver).

## Step 7 · Formal revision record (close-out)

After approval, log the revision: commit hash(es) · files touched · the
three-line summary. If anything was carved or legislated along the way, its
registration (entry C) and the design system's `lastChange` must already be
in place — a task is not closed while the library lags behind the product.

## Relationship to the update workflow

This flow *applies* the law and runs on every task with two lightweight
confirmations (plan, result). `docs/design-system-workflow.md` *changes* the
law and carries the heavy gates. They meet at the bridge: ladder rung 4 and
the new-component registration both enter it at entry C.
