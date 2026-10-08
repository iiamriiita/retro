# Design system update workflow

How changes to the design system are made. `docs/design-system.md` is the law
(what the rules are); this file is the amendment procedure (how the rules
change). Agents MUST follow it for any change to tokens, principles, motion
rules or component specs. Ordinary product work that merely *uses* the system
is not covered here — this applies the moment the system itself would change.

## Entries — how a change request is born

- **A · Spoken request.** The owner asks in plain words ("make the hover gold a
  bit brighter"). The agent first translates it into a structured change
  ticket: type (extend / add / adjust) · item · old value → new value · reason.
- **B · Artifact page edit.** The owner edits a source file in place on the
  overview artifact and saves; the saved draft lands in the artifact's db. The
  owner then tells the agent. The agent reads the draft, diffs it against the
  current source, and produces the change ticket.
- **C · Agent-initiated proposal.** While doing design work, the agent finds
  that no existing component fits, or that applying an existing rule would be
  unreasonable. The agent writes a proposal — type (extend / add / adjust) ·
  reason · potential risks — and presents it. **Never work around the system
  silently; this entry is the legal route.**

All three entries converge on the same pipeline. No bypass.

## Gate 1 — owner confirms the change ticket

The owner approves that the change should happen at all. Without this
approval, stop. Nothing has been modified yet.

## Step 1 — impact check (produce the list, touch nothing)

Run all five checks and output the findings as a list:

| # | Check | Question |
|---|---|---|
| a | Alias chain | Which tokens reference this one and will follow it? |
| b | Component blast radius | Which component specs cite this token or rule? |
| c | Product blast radius | Which `globals.css` classes / `components/*.tsx` use it? |
| d | Constitutionality | Does it violate any of the six principles? If so, the principle must be amended first — say so. |
| e | Contrast | If a text color moves, re-check WCAG (and the readable-gold rule). |

## Gate 2 — owner confirms the impact list

The owner approves the consequences. On "no": pause, revise the change ticket,
re-run Step 1. Both gates sit **before any file is touched**, so backing out is
free.

## Steps 2–5 — execute, strictly in this order

The order is law → build → broadcast (先修法、再施工、最後傳播). Reversing it
creates a moment where code is newer than its documentation — which is exactly
where drift is born.

1. **Step 2 · Amend the sources (layer 1).** Update `tokens.json`,
   `README.md`, `motion.md`, `components/*/README.md` — in **both languages**
   (zh + en mirrors) in the same pass.
2. **Step 3 · Land in the product.** Update `app/globals.css` (`:root` and the
   component classes) and, where needed, `components/*.tsx`. The change counts
   as landed only when the build passes.
3. **Step 4 · Sync every projection.** The two published Design System
   artifacts (content files first, the `design-system.json` index with a fresh
   `lastChange` **last**), the overview artifact (raw sources + rendered panes
   + editor baselines), and in this repo both `docs/design-system/` (the
   file-per-file mirror) and `docs/design-system.md` (the packed view). Commit
   and push.
4. **Step 5 · Close out.** Report a change summary (items · files touched ·
   commit hash · artifact versions), then **delete the merged db drafts** on
   the overview artifact so the new originals become the editing baseline —
   stale drafts would otherwise shadow them.

## Trigger phrases

- 「同步設計系統」 — entry B: read the saved drafts, diff, run the pipeline.
- 「設計系統改 X」 — entry A: draft the change ticket, start at Gate 1.

## Three iron rules

1. **Two gates, both before any file changes.** Gate 1 decides *whether*,
   Gate 2 decides *at what cost*. No approval, no edits.
2. **Law → build → broadcast is irreversible.** Sources first, product second,
   projections last — always.
3. **Close-out always clears drafts.** A merged draft left in the db will mask
   the new original the next time the editor opens.
