---
name: design-system-update
description: Run the Team Retro design-system update workflow. Use whenever the owner asks to change, extend or sync the design system — tokens, principles, motion rules or component specs — including the trigger phrases 「同步設計系統」 (read saved drafts from the overview artifact and sync) and 「設計系統改 X」 (draft a change ticket for X). Also use when, during ordinary UI work, existing components or rules don't fit and a system change must be proposed instead of worked around.
---

# Design system update

Follow **`docs/design-system-workflow.md`** exactly. It is the amendment
procedure for the design system; `docs/design-system/` holds the canonical
sources and `docs/design-system.md` is their packed view. Summary of the
procedure (the workflow doc is authoritative where they differ):

## 1. Identify the entry and draft the change ticket

- **A · Spoken request** — translate the owner's words into a ticket:
  type (extend / add / adjust) · item · old value → new value · reason.
- **B · Artifact page edit** — the owner saved drafts on the overview
  artifact. Read collection `files` of its db (ArtifactData; zh drafts use the
  plain path as doc id with `/`→`__`, EN drafts are prefixed `en__`), diff
  against the current sources, and build the ticket from the diff.
- **C · Agent-initiated** — you found the system insufficient or a rule
  unreasonable during a task. Write the proposal: type · reason · risks.
  Never work around the system silently.

## 2. Gate 1 — owner confirms the ticket

Present the ticket and stop until the owner approves. Touch nothing yet.

## 3. Step 1 — impact check (still touch nothing)

Produce the five-point list: (a) alias-chain effects, (b) component specs
citing it, (c) product usage in `app/globals.css` / `components/*.tsx`,
(d) constitutionality against the six principles (an unconstitutional change
amends the principle first), (e) WCAG contrast where text colors move.

## 4. Gate 2 — owner confirms the impact list

On "no": pause, revise the ticket, re-run the impact check.

## 5. Execute strictly sources → product → projections

1. **Sources**: `docs/design-system/` files, zh + en mirrors together (the zh
   sources live on the published artifacts and the overview page's raw
   blocks).
2. **Product**: `app/globals.css` (`:root`, classes), `components/*.tsx` as
   needed; the build must pass.
3. **Projections**: the two Design System artifacts (content files first, the
   `design-system.json` index with fresh `lastChange` LAST), the overview
   artifact (raw blocks + rendered panes + editor baselines), and in this repo
   both `docs/design-system/` and the packed `docs/design-system.md`. Commit
   and push.
4. **Close out**: report items · files · commit hash · artifact versions,
   then DELETE the merged db drafts so the new originals become the editing
   baseline.

## Known locations (claude.ai sessions)

- Overview artifact (file browser + editor db): https://claude.ai/artifact/2i4YjLEqWj4poD9wsbCAFn
- Design System artifact · zh: https://claude.ai/artifact/CE1N4tKyVMf1wmnqCFSaes
- Design System artifact · en: https://claude.ai/artifact/Kppnt6NKfdykM84t1XCLS1
- Workflow flowchart: https://claude.ai/artifact/MJVve9HXsFjkxeYgN9FUDC

In environments without artifact tools, update the repo forms, state plainly
which projections were NOT synced, and list them as follow-up.
